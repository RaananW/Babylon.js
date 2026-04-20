import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { type GlobalState } from "../../globalState";
import { SerializationTools } from "../../serializationTools";
import { LogEntry } from "../log/logComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";

interface IMcpSessionComponentProps {
    globalState: GlobalState;
}

/**
 * Panel that connects to a live MCP session for bidirectional material sync.
 * @returns The React element.
 */
export const McpSessionComponent: React.FC<IMcpSessionComponentProps> = ({ globalState }) => {
    const [url, setUrl] = useState<string>(globalState.mcpSessionUrl ?? "");
    const [connected, setConnected] = useState<boolean>(globalState.mcpSessionConnected);

    // Sync local state with globalState when the component mounts or the
    // connection state changes externally (e.g. SSE error while unmounted).
    useEffect(() => {
        const observer = globalState.onMcpSessionStateChangedObservable.add((state) => {
            setConnected(state);
        });
        // Sync on mount in case state changed while we were unmounted
        setConnected(globalState.mcpSessionConnected);
        if (globalState.mcpSessionUrl) {
            setUrl(globalState.mcpSessionUrl);
        }
        return () => {
            globalState.onMcpSessionStateChangedObservable.remove(observer);
        };
    }, [globalState]);

    const loadMaterialFromJson = useCallback(
        (json: any) => {
            SerializationTools.Deserialize(json, globalState);
            if (!globalState.nodeMaterial) {
                return;
            }
            // Don't call nodeMaterial.build() here — the onResetRequiredObservable
            // handler in GraphEditor calls build() (which creates graph nodes and
            // positions them from editorData) then buildMaterial() (which compiles
            // shaders).  Calling build() here would trigger UpdateLocations before
            // graph nodes exist, zeroing all editorData positions.
            globalState.onResetRequiredObservable.notifyObservers(false);
            globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
            globalState.onClearUndoStack.notifyObservers();
            // Zoom to fit so the user always sees the full graph after an update
            globalState.onZoomToFitRequiredObservable.notifyObservers();
        },
        [globalState]
    );

    const handleConnect = useCallback(
        async (pushOnConnect: boolean = false) => {
            const sessionUrl = url.replace(/\/$/, ""); // trim trailing slash
            if (!sessionUrl) {
                return;
            }

            try {
                // Optionally push current NME material to the MCP session so the agent starts with what the user has
                if (pushOnConnect && globalState.nodeMaterial) {
                    const json = SerializationTools.Serialize(globalState.nodeMaterial, globalState);
                    await fetch(`${sessionUrl}/material`, {
                        method: "POST",
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        headers: { "Content-Type": "application/json" },
                        body: json,
                    });
                }

                // Close any pre-existing EventSource before opening a new one
                if (globalState.mcpEventSource) {
                    globalState.mcpEventSource.close();
                    globalState.mcpEventSource = null;
                }

                // Open SSE connection — stored on globalState so it survives
                // component unmount/remount cycles.
                const es = new EventSource(`${sessionUrl}/events`);
                globalState.mcpEventSource = es;

                es.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        loadMaterialFromJson(data);
                    } catch {
                        // Ignore parse errors from keepalive comments
                    }
                };

                // Listen for explicit session-closed event from the MCP server
                es.addEventListener("session-closed", (event) => {
                    const info = JSON.parse((event as MessageEvent).data);
                    globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`MCP Session ended: ${info.reason}`, false));
                    globalState.mcpSessionConnected = false;
                    globalState.mcpEventSource = null;
                    globalState.onMcpSessionStateChangedObservable.notifyObservers(false);
                    es.close();
                });

                es.onerror = () => {
                    globalState.mcpSessionConnected = false;
                    globalState.mcpEventSource = null;
                    globalState.onMcpSessionStateChangedObservable.notifyObservers(false);
                    es.close();
                };

                // Update state — the observable listener sets local `connected`
                globalState.mcpSessionUrl = sessionUrl;
                globalState.mcpSessionConnected = true;
                globalState.onMcpSessionStateChangedObservable.notifyObservers(true);
            } catch (err) {
                globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`MCP Session: Connection failed — ${err}`, true));
            }
        },
        [url, globalState, loadMaterialFromJson]
    );

    const handleDisconnect = useCallback(() => {
        if (globalState.mcpEventSource) {
            globalState.mcpEventSource.close();
            globalState.mcpEventSource = null;
        }
        globalState.mcpSessionConnected = false;
        globalState.mcpSessionUrl = null;
        globalState.onMcpSessionStateChangedObservable.notifyObservers(false);
    }, [globalState]);

    const handlePush = useCallback(async () => {
        if (!globalState.mcpSessionUrl || !globalState.nodeMaterial) {
            return;
        }
        const json = SerializationTools.Serialize(globalState.nodeMaterial, globalState);
        try {
            const res = await fetch(`${globalState.mcpSessionUrl}/material`, {
                method: "POST",
                // eslint-disable-next-line @typescript-eslint/naming-convention
                headers: { "Content-Type": "application/json" },
                body: json,
            });
            if (!res.ok) {
                globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`MCP Session: Push failed (${res.status})`, true));
            }
        } catch (err) {
            globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`MCP Session: Push failed — ${err}`, true));
        }
    }, [globalState]);

    return (
        <LineContainerComponent title="MCP SESSION" closed={true}>
            <TextInputLineComponent
                label="Session URL"
                value={url}
                onChange={(value) => setUrl(value)}
                placeholder="http://localhost:3001/session/..."
                disabled={connected}
                lockObject={globalState.lockObject}
            />
            <TextLineComponent label="Status" value={connected ? "Connected" : "Disconnected"} color={connected ? "#4caf50" : "#888"} />
            {!connected ? (
                <>
                    <ButtonLineComponent
                        label="Connect"
                        onClick={() => {
                            void handleConnect(false);
                        }}
                    />
                    <ButtonLineComponent
                        label="Connect & Push"
                        onClick={() => {
                            void handleConnect(true);
                        }}
                    />
                </>
            ) : (
                <>
                    <ButtonLineComponent label="Disconnect" onClick={handleDisconnect} />
                    <ButtonLineComponent
                        label="Push to MCP"
                        onClick={() => {
                            void handlePush();
                        }}
                    />
                </>
            )}
        </LineContainerComponent>
    );
};
