/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/**
 * SessionServer — built-in HTTP server that enables a live bidirectional
 * session between the NME MCP server and the Node Material Editor UI.
 *
 * The MCP server broadcasts material changes to the editor via SSE, and the
 * editor can push user changes back to the MCP server via POST.
 *
 * **No lock mechanism**: The MCP server and the user can both modify the material,
 * but NOT simultaneously. If the user edits the material in the editor while the AI
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
 *    sessions (one per material), keyed by session ID.
 */

import * as http from "http";
import * as crypto from "crypto";
import { type MaterialGraphManager } from "./materialGraph.js";

// ═══════════════════════════════════════════════════════════════════════════
//  Session server state
// ═══════════════════════════════════════════════════════════════════════════

let _server: http.Server | null = null;
let _port: number = 0;
let _manager: MaterialGraphManager | null = null;

/** Maps sessionId → materialName */
const _sessions = new Map<string, string>();
/** Reverse map: materialName → sessionId */
const _materialToSession = new Map<string, string>();
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
 * Create a new session for a material.
 * @param materialName - The name of the material to associate with this session.
 * @returns The new session ID (8-char alphanumeric).
 */
export function createSession(materialName: string): string {
    // If there's already a session for this material, return it
    const existing = _materialToSession.get(materialName);
    if (existing) {
        return existing;
    }

    const sessionId = crypto.randomBytes(4).toString("hex"); // 8 hex chars
    _sessions.set(sessionId, materialName);
    _materialToSession.set(materialName, sessionId);
    _sseClients.set(sessionId, new Set());
    return sessionId;
}

/**
 * Get the session ID for a given material, if one exists.
 * @param materialName - The name of the material.
 * @returns The session ID, or undefined if no session exists for this material.
 */
export function getSessionForMaterial(materialName: string): string | undefined {
    return _materialToSession.get(materialName);
}

/**
 * Get the full session URL.
 * @param sessionId - The session ID.
 * @param port - The port the server is running on.
 * @returns The full URL to access this session (e.g. http://localhost:3001/session/abcd1234).
 */
export function getSessionUrl(sessionId: string, port: number): string {
    return `http://localhost:${port}/session/${sessionId}`;
}

/**
 * Push the latest material JSON to all SSE subscribers of a session.
 * @param sessionId - The session ID to notify.
 */
export function notifyMaterialUpdate(sessionId: string): void {
    if (!_manager) {
        return;
    }
    const materialName = _sessions.get(sessionId);
    if (!materialName) {
        return;
    }
    const json = _manager.exportJSON(materialName);
    if (!json) {
        return;
    }
    const clients = _sseClients.get(sessionId);
    if (!clients || clients.size === 0) {
        return;
    }
    // SSE data lines must not contain raw newlines — compact the JSON to a single line
    const compact = JSON.stringify(JSON.parse(json));
    const payload = `data: ${compact}\n\n`;
    for (const res of clients) {
        res.write(payload);
    }
}

/**
 * Start the session server if not already running.
 * @param manager - The MaterialGraphManager instance.
 * @param port - Port to listen on (default 3001). Tries up to port+9 if in use.
 * @returns The port the server is listening on.
 */
export async function startSessionServer(manager: MaterialGraphManager, port: number = 3001): Promise<number> {
    _manager = manager;

    if (_server && _server.listening) {
        return _port;
    }

    const maxPort = port + 9;
    const tryPort = await _tryPortRange(port, maxPort);
    _port = tryPort;
    console.error(`[session-server] Listening on http://localhost:${_port}`);
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
    // Close all SSE clients
    for (const clients of _sseClients.values()) {
        for (const res of clients) {
            res.end();
        }
        clients.clear();
    }
    _sseClients.clear();
    _sessions.clear();
    _materialToSession.clear();

    if (!_server) {
        return;
    }
    return await new Promise((resolve, reject) => {
        _server!.close((err) => {
            _server = null;
            if (err) {
                reject(new Error(err.message));
            } else {
                resolve();
            }
        });
    });
}

/**
 * Close a single session — disconnect all SSE clients and remove it from maps.
 * @param sessionId - The session ID to close.
 * @returns True if the session existed and was closed, false otherwise.
 */
export function closeSession(sessionId: string): boolean {
    const materialName = _sessions.get(sessionId);
    if (!materialName) {
        return false;
    }
    // Notify all SSE clients that the session is ending, then close
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
    _materialToSession.delete(materialName);
    return true;
}

/**
 * Close a session by material name.
 * @param materialName - The material name whose session should be closed.
 * @returns True if a session was closed, false if none existed.
 */
export function closeSessionForMaterial(materialName: string): boolean {
    const sessionId = _materialToSession.get(materialName);
    if (!sessionId) {
        return false;
    }
    return closeSession(sessionId);
}

/**
 * Returns the port the session server is running on (0 if not running).
 * @returns The port number, or 0 if the server is not running.
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
            reject(new Error(err.message));
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
        const lines = ["NME MCP Session Server", ""];
        if (_sessions.size === 0) {
            lines.push("No active sessions.");
        } else {
            lines.push("Active sessions:");
            for (const [sid, matName] of _sessions.entries()) {
                const clientCount = _sseClients.get(sid)?.size ?? 0;
                lines.push(`  ${sid} → ${matName} (${clientCount} subscriber${clientCount !== 1 ? "s" : ""})`);
            }
        }
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(lines.join("\n"));
        return;
    }

    // ── Parse /session/:id/... routes ───────────────────────────────────
    const sessionMatch = pathname.match(/^\/session\/([a-f0-9]+)\/(events|material)$/);
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

        if (route === "material" && req.method === "GET") {
            _handleGetMaterial(sessionId, res);
            return;
        }

        if (route === "material" && req.method === "POST") {
            _handlePostMaterial(sessionId, req, res);
            return;
        }
    }

    // Handle /session/:id (no trailing route) as redirect-like info
    if (sessionMatchBase && req.method === "GET") {
        const sessionId = sessionMatchBase[1];
        if (_sessions.has(sessionId)) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({ sessionId, materialName: _sessions.get(sessionId), eventsUrl: `/session/${sessionId}/events`, materialUrl: `/session/${sessionId}/material` })
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

    // Send an initial comment so the client knows the connection is alive
    res.write(": connected\n\n");

    // Immediately push the current material state so the editor loads it on connect
    const materialName = _sessions.get(sessionId);
    if (materialName && _manager) {
        const json = _manager.exportJSON(materialName);
        if (json) {
            const compact = JSON.stringify(JSON.parse(json));
            res.write(`data: ${compact}\n\n`);
        }
    }

    // Remove client on disconnect
    res.on("close", () => {
        clients.delete(res);
    });
}

function _handleGetMaterial(sessionId: string, res: http.ServerResponse): void {
    const materialName = _sessions.get(sessionId)!;
    const json = _manager?.exportJSON(materialName);
    if (!json) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `Material "${materialName}" not found in manager` }));
        return;
    }
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-cache" });
    res.end(json);
}

function _handlePostMaterial(sessionId: string, req: http.IncomingMessage, res: http.ServerResponse): void {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf-8");
        const materialName = _sessions.get(sessionId)!;
        try {
            // Validate JSON
            JSON.parse(body);
        } catch {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid JSON" }));
            return;
        }

        const result = _manager?.importJSON(materialName, body);
        if (result && result !== "OK") {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: result }));
            return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));

        // Broadcast to all OTHER SSE subscribers (the poster already has the data)
        // We broadcast to all since we can't identify who posted
        notifyMaterialUpdate(sessionId);
    });
}
