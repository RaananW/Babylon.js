import * as React from "react";
import { useRef, useState, useCallback } from "react";
import { type GlobalState } from "../../globalState";

import "../../scss/mcpSession.scss";

interface IMcpSessionComponentProps {
    globalState: GlobalState;
}

/**
 * Floating panel that connects to a live Playground MCP session
 * for bidirectional code sync between an AI agent and the Playground editor.
 * @returns The React element.
 */
export const McpSessionComponent: React.FC<IMcpSessionComponentProps> = ({ globalState }) => {
    const [url, setUrl] = useState<string>("");
    const [connected, setConnected] = useState<boolean>(false);
    const [collapsed, setCollapsed] = useState<boolean>(true);
    const eventSourceRef = useRef<EventSource | null>(null);

    const loadCodeFromSession = useCallback(
        (data: { code: string; language: string }) => {
            if (typeof data.code !== "string") {
                return;
            }
            // Update the globalState code — this triggers the Monaco editor to refresh
            globalState.currentCode = data.code;

            // If language changed, update it
            if (data.language === "TS" && globalState.language !== "TS") {
                globalState.language = "TS";
                globalState.onLanguageChangedObservable.notifyObservers();
            } else if (data.language === "JS" && globalState.language !== "JS") {
                globalState.language = "JS";
                globalState.onLanguageChangedObservable.notifyObservers();
            }

            globalState.onCodeLoaded.notifyObservers(data.code);
        },
        [globalState]
    );

    const handleConnect = useCallback(async () => {
        const sessionUrl = url.replace(/\/$/, "");
        if (!sessionUrl) {
            return;
        }

        try {
            // 1. Push current playground code to the MCP session so the agent starts with what the user has
            const payload = JSON.stringify({
                code: globalState.currentCode,
                language: globalState.language,
            });
            await fetch(`${sessionUrl}/code`, {
                method: "POST",
                // eslint-disable-next-line @typescript-eslint/naming-convention
                headers: { "Content-Type": "application/json" },
                body: payload,
            });

            // 2. Open SSE connection to receive future updates from the agent
            const es = new EventSource(`${sessionUrl}/events`);
            eventSourceRef.current = es;

            es.onmessage = (event) => {
                try {
                    const parsed = JSON.parse(event.data);
                    loadCodeFromSession(parsed);
                } catch {
                    // Ignore parse errors from keepalive comments
                }
            };

            es.addEventListener("session-closed", () => {
                setConnected(false);
                es.close();
                eventSourceRef.current = null;
            });

            es.onerror = () => {
                setConnected(false);
                es.close();
                eventSourceRef.current = null;
            };

            setConnected(true);
        } catch {
            // Connection failed — user can retry
        }
    }, [url, globalState, loadCodeFromSession]);

    const handleDisconnect = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        setConnected(false);
    }, []);

    const handlePush = useCallback(async () => {
        if (!url) {
            return;
        }
        const sessionUrl = url.replace(/\/$/, "");
        const payload = JSON.stringify({
            code: globalState.currentCode,
            language: globalState.language,
        });
        try {
            const res = await fetch(`${sessionUrl}/code`, {
                method: "POST",
                // eslint-disable-next-line @typescript-eslint/naming-convention
                headers: { "Content-Type": "application/json" },
                body: payload,
            });
            if (!res.ok) {
                return;
            }
        } catch {
            // Push failed — user can retry
        }
    }, [url, globalState]);

    if (collapsed) {
        return (
            <div className="mcp-session-panel mcp-session-panel--collapsed" onClick={() => setCollapsed(false)}>
                <div className="mcp-session-header">
                    <span className="mcp-session-title">MCP Session {connected && <span className="mcp-session-dot mcp-session-dot--connected" />}</span>
                    <span className="mcp-session-toggle">&#9650;</span>
                </div>
            </div>
        );
    }

    return (
        <div className="mcp-session-panel">
            <div className="mcp-session-header" onClick={() => setCollapsed(true)}>
                <span className="mcp-session-title">MCP Session</span>
                <span className="mcp-session-toggle">&#9660;</span>
            </div>
            <div className="mcp-session-body">
                <div className="mcp-session-row">
                    <input
                        className="mcp-session-input"
                        type="text"
                        placeholder="http://localhost:3002/session/..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={connected}
                    />
                </div>
                <div className="mcp-session-status">
                    <span className={`mcp-session-dot ${connected ? "mcp-session-dot--connected" : "mcp-session-dot--disconnected"}`} />
                    <span>{connected ? "Connected" : "Disconnected"}</span>
                </div>
                <div className="mcp-session-row">
                    {!connected ? (
                        <button className="mcp-session-btn" onClick={() => void handleConnect()}>
                            Connect
                        </button>
                    ) : (
                        <>
                            <button className="mcp-session-btn mcp-session-btn--disconnect" onClick={handleDisconnect}>
                                Disconnect
                            </button>
                            <button className="mcp-session-btn mcp-session-btn--secondary" onClick={() => void handlePush()}>
                                Push to MCP
                            </button>
                        </>
                    )}
                </div>
                <div className="mcp-session-note">Do not edit while the AI agent is working — changes may conflict.</div>
            </div>
        </div>
    );
};
