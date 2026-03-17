/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/**
 * SessionServer — built-in HTTP server that enables a live bidirectional
 * session between the Playground MCP server and the Playground UI.
 *
 * The MCP server broadcasts code changes to the playground via SSE, and the
 * playground can push user changes back to the MCP server via POST.
 *
 * **No lock mechanism**: The MCP server and the user can both modify the code,
 * but NOT simultaneously. If the user edits code in the playground while the AI
 * agent is calling MCP tools, their changes will be overwritten by the next agent
 * push. Users should finish their own edits before asking the agent to continue,
 * and vice versa.
 *
 * Key design decisions:
 * ────────────────────
 * 1. **Zero external dependencies** — uses Node's built-in `http` and `crypto` modules.
 * 2. **Singleton** — only one session server runs at a time.
 * 3. **Non-blocking** — the HTTP server runs in the background and does not
 *    interfere with the MCP stdio transport.
 * 4. **Multi-session** — one server instance can serve multiple simultaneous
 *    sessions (one per playground), keyed by session ID.
 */

import * as http from "http";
import * as crypto from "crypto";
import type { PlaygroundManager } from "./playgroundManager.js";

// ═══════════════════════════════════════════════════════════════════════════
//  Session server state
// ═══════════════════════════════════════════════════════════════════════════

let _server: http.Server | null = null;
let _port: number = 0;
let _manager: PlaygroundManager | null = null;

/** Maps sessionId → playgroundName */
const _sessions = new Map<string, string>();
/** Reverse map: playgroundName → sessionId */
const _playgroundToSession = new Map<string, string>();
/** Maps sessionId → Set of SSE response objects */
const _sseClients = new Map<string, Set<http.ServerResponse>>();
/** Keepalive interval handle */
let _keepAliveInterval: ReturnType<typeof setInterval> | null = null;

// ═══════════════════════════════════════════════════════════════════════════
//  Public API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Whether the session server is currently running.
 * @returns True if running, false otherwise.
 */
export function isSessionServerRunning(): boolean {
    return _server !== null && _server.listening;
}

/**
 * Create a new session for a playground.
 * @param playgroundName - The name of the playground to associate with this session.
 * @returns The new session ID (8-char hex).
 */
export function createSession(playgroundName: string): string {
    // If there's already a session for this playground, return it
    const existing = _playgroundToSession.get(playgroundName);
    if (existing) {
        return existing;
    }

    const sessionId = crypto.randomBytes(4).toString("hex");
    _sessions.set(sessionId, playgroundName);
    _playgroundToSession.set(playgroundName, sessionId);
    _sseClients.set(sessionId, new Set());
    return sessionId;
}

/**
 * Get the session ID for a given playground, if one exists.
 * @param playgroundName - The name of the playground.
 * @returns The session ID, or undefined if no session exists.
 */
export function getSessionForPlayground(playgroundName: string): string | undefined {
    return _playgroundToSession.get(playgroundName);
}

/**
 * Get the full session URL.
 * @param sessionId - The session ID.
 * @param port - The port the server is running on.
 * @returns The full URL.
 */
export function getSessionUrl(sessionId: string, port: number): string {
    return `http://localhost:${port}/session/${sessionId}`;
}

/**
 * Push the latest playground JSON to all SSE subscribers of a session.
 * @param sessionId - The session ID to notify.
 */
export function notifySessionUpdate(sessionId: string): void {
    if (!_manager) {
        return;
    }
    const playgroundName = _sessions.get(sessionId);
    if (!playgroundName) {
        return;
    }
    const json = _manager.exportJSON(playgroundName);
    if (!json) {
        return;
    }
    const clients = _sseClients.get(sessionId);
    if (!clients || clients.size === 0) {
        return;
    }
    const compact = JSON.stringify(JSON.parse(json));
    const payload = `data: ${compact}\n\n`;
    for (const res of clients) {
        res.write(payload);
    }
}

/**
 * Start the session server if not already running.
 * @param manager - The PlaygroundManager instance.
 * @param port - Port to listen on (default 3002). Tries up to port+9 if in use.
 * @returns The port the server is listening on.
 */
export async function startSessionServer(manager: PlaygroundManager, port: number = 3002): Promise<number> {
    _manager = manager;

    if (_server && _server.listening) {
        return _port;
    }

    const maxPort = port + 9;
    const tryPort = await _tryPortRange(port, maxPort);
    _port = tryPort;
    console.error(`[playground-session-server] Listening on http://localhost:${_port}`);
    // Start keepalive pings every 15s
    _keepAliveInterval = setInterval(() => {
        for (const clients of _sseClients.values()) {
            for (const res of clients) {
                res.write(": ping\n\n");
            }
        }
    }, 15_000);
    return _port;
}

/**
 * Stop the session server.
 * @returns Resolves when the server is fully stopped.
 */
export async function stopSessionServer(): Promise<void> {
    if (_keepAliveInterval) {
        clearInterval(_keepAliveInterval);
        _keepAliveInterval = null;
    }
    for (const clients of _sseClients.values()) {
        for (const res of clients) {
            res.end();
        }
        clients.clear();
    }
    _sseClients.clear();
    _sessions.clear();
    _playgroundToSession.clear();

    if (!_server) {
        return;
    }
    return await new Promise((resolve, reject) => {
        _server!.close((err) => {
            _server = null;
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Close a single session.
 * @param sessionId - The session ID to close.
 * @returns True if the session existed and was closed.
 */
export function closeSession(sessionId: string): boolean {
    const playgroundName = _sessions.get(sessionId);
    if (!playgroundName) {
        return false;
    }
    const clients = _sseClients.get(sessionId);
    if (clients) {
        for (const res of clients) {
            res.write(`event: session-closed\ndata: ${JSON.stringify({ reason: "Session closed by MCP server" })}\n\n`);
            res.end();
        }
        clients.clear();
    }
    _sseClients.delete(sessionId);
    _sessions.delete(sessionId);
    _playgroundToSession.delete(playgroundName);
    return true;
}

/**
 * Close a session by playground name.
 * @param playgroundName - The playground name whose session should be closed.
 * @returns True if a session was closed.
 */
export function closeSessionForPlayground(playgroundName: string): boolean {
    const sessionId = _playgroundToSession.get(playgroundName);
    if (!sessionId) {
        return false;
    }
    return closeSession(sessionId);
}

/**
 * Returns the port the session server is running on (0 if not running).
 * @returns The port number.
 */
export function getSessionServerPort(): number {
    return _port;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Internal helpers
// ═══════════════════════════════════════════════════════════════════════════

async function _tryPortRange(start: number, end: number): Promise<number> {
    let lastErr: unknown;
    for (let p = start; p <= end; p++) {
        try {
            // eslint-disable-next-line no-await-in-loop
            await _startOnPort(p);
            return p;
        } catch (err) {
            lastErr = err;
        }
    }
    throw lastErr ?? new Error(`Could not find an open port between ${start} and ${end}`);
}

async function _startOnPort(port: number): Promise<void> {
    return await new Promise((resolve, reject) => {
        const srv = http.createServer(_handleRequest);
        srv.once("error", (err: NodeJS.ErrnoException) => {
            reject(err);
        });
        srv.listen(port, () => {
            _server = srv;
            resolve();
        });
    });
}

function _setCorsHeaders(res: http.ServerResponse): void {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function _handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    _setCorsHeaders(res);

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url ?? "/", `http://localhost:${_port}`);
    const pathname = url.pathname;

    // ── Route: GET / — Status page ──────────────────────────────────────
    if (pathname === "/" && req.method === "GET") {
        const lines = ["Playground MCP Session Server", ""];
        if (_sessions.size === 0) {
            lines.push("No active sessions.");
        } else {
            lines.push("Active sessions:");
            for (const [sid, pgName] of _sessions.entries()) {
                const clientCount = _sseClients.get(sid)?.size ?? 0;
                lines.push(`  ${sid} → ${pgName} (${clientCount} subscriber${clientCount !== 1 ? "s" : ""})`);
            }
        }
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(lines.join("\n"));
        return;
    }

    // ── Parse /session/:id/... routes ───────────────────────────────────
    const sessionMatch = pathname.match(/^\/session\/([a-f0-9]+)\/(events|code)$/);
    const sessionMatchBase = pathname.match(/^\/session\/([a-f0-9]+)$/);

    if (sessionMatch) {
        const sessionId = sessionMatch[1];
        const route = sessionMatch[2];

        if (!_sessions.has(sessionId)) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: `Session "${sessionId}" not found` }));
            return;
        }

        if (route === "events" && req.method === "GET") {
            _handleSSE(sessionId, res);
            return;
        }

        if (route === "code" && req.method === "GET") {
            _handleGetCode(sessionId, res);
            return;
        }

        if (route === "code" && req.method === "POST") {
            _handlePostCode(sessionId, req, res);
            return;
        }
    }

    // Handle /session/:id (no trailing route)
    if (sessionMatchBase && req.method === "GET") {
        const sessionId = sessionMatchBase[1];
        if (_sessions.has(sessionId)) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({
                    sessionId,
                    playgroundName: _sessions.get(sessionId),
                    eventsUrl: `/session/${sessionId}/events`,
                    codeUrl: `/session/${sessionId}/code`,
                })
            );
            return;
        }
    }

    // ── 404 ─────────────────────────────────────────────────────────────
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
}

function _handleSSE(sessionId: string, res: http.ServerResponse): void {
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    });
    res.flushHeaders();

    const clients = _sseClients.get(sessionId)!;
    clients.add(res);

    res.write(": connected\n\n");

    res.on("close", () => {
        clients.delete(res);
    });
}

function _handleGetCode(sessionId: string, res: http.ServerResponse): void {
    const playgroundName = _sessions.get(sessionId)!;
    const json = _manager?.exportJSON(playgroundName);
    if (!json) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `Playground "${playgroundName}" not found in manager` }));
        return;
    }
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-cache" });
    res.end(json);
}

function _handlePostCode(sessionId: string, req: http.IncomingMessage, res: http.ServerResponse): void {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf-8");
        const playgroundName = _sessions.get(sessionId)!;
        try {
            JSON.parse(body);
        } catch {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid JSON" }));
            return;
        }

        const result = _manager?.importJSON(playgroundName, body);
        if (result && result !== "OK") {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: result }));
            return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));

        // Broadcast to all SSE subscribers
        notifySessionUpdate(sessionId);
    });
}
