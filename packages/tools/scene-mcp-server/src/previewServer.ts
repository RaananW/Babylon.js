/* eslint-disable @typescript-eslint/naming-convention */
/**
 * PreviewServer — built-in HTTP server that serves a live preview of the
 * current scene directly from the MCP server's in-memory state.
 *
 * Key design decisions:
 * ────────────────────
 * 1. **Zero external dependencies** — uses Node's built-in `http` module.
 * 2. **Always live** — every HTTP request regenerates the page from the
 *    current scene state, so the preview always reflects the latest changes.
 * 3. **Singleton** — only one preview server runs at a time.
 * 4. **Non-blocking** — the HTTP server runs in the background and does not
 *    interfere with the MCP stdio transport.
 */

import * as http from "http";
import type { SceneManager } from "./sceneManager.js";

// ═══════════════════════════════════════════════════════════════════════════
//  Preview server state
// ═══════════════════════════════════════════════════════════════════════════

let _server: http.Server | null = null;
let _port: number = 0;
let _sceneName: string = "";
let _manager: SceneManager | null = null;

/**
 * Whether the preview server is currently running.
 * @returns True if the preview server is running, false otherwise.
 */
export function isPreviewRunning(): boolean {
    return _server !== null && _server.listening;
}

/**
 * Returns the current preview URL, or null if not running.
 * @returns The preview URL if running, or null if not.
 */
export function getPreviewUrl(): string | null {
    if (!isPreviewRunning()) {
        return null;
    }
    return `http://localhost:${_port}`;
}

/**
 * Returns the scene name being previewed.
 * @returns The name of the scene being previewed, or null if not running.
 */
export function getPreviewSceneName(): string | null {
    if (!isPreviewRunning()) {
        return null;
    }
    return _sceneName;
}

// ═══════════════════════════════════════════════════════════════════════════
//  HTML generation
// ═══════════════════════════════════════════════════════════════════════════

function generatePreviewHtml(manager: SceneManager, sceneName: string): string {
    // Use export_scene_code with HTML boilerplate to get a complete standalone page
    const code = manager.exportCode(sceneName, {
        wrapInFunction: true,
        functionName: "createScene",
        includeHtmlBoilerplate: true,
        includeEngineSetup: true,
        includeRenderLoop: true,
        format: "umd",
        enableCollisionCallbacks: false,
    });

    if (!code) {
        return [
            `<!DOCTYPE html>`,
            `<html><head><meta charset="UTF-8"><title>Preview Error</title>`,
            `<style>body { font-family: system-ui; background: #1e1e2e; color: #cdd6f4; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }`,
            `.error { text-align: center; } h1 { color: #f38ba8; } code { background: #313244; padding: 2px 8px; border-radius: 4px; }</style>`,
            `</head><body><div class="error"><h1>Scene Not Found</h1>`,
            `<p>No scene named <code>${sceneName}</code> exists in the MCP server.</p>`,
            `<p>Create a scene first, then refresh this page.</p></div></body></html>`,
        ].join("\n");
    }

    return code;
}

function generateStatusPage(manager: SceneManager): string {
    // List all scenes with links
    const scenes = manager.listScenes();
    const sceneLinks =
        scenes.length === 0
            ? "<p>No scenes created yet. Use the MCP tools to create a scene, then start the preview.</p>"
            : scenes.map((s) => `<li><a href="/scene/${encodeURIComponent(s)}">${s}</a></li>`).join("\n");

    return [
        `<!DOCTYPE html>`,
        `<html><head><meta charset="UTF-8"><title>Babylon.js MCP Preview</title>`,
        `<style>`,
        `  body { font-family: system-ui; background: #1e1e2e; color: #cdd6f4; margin: 40px auto; max-width: 600px; }`,
        `  h1 { color: #89b4fa; } a { color: #a6e3a1; } li { margin: 8px 0; }`,
        `  .active { background: #313244; padding: 16px; border-radius: 8px; margin: 16px 0; }`,
        `  code { background: #313244; padding: 2px 8px; border-radius: 4px; }`,
        `</style></head><body>`,
        `<h1>Babylon.js MCP Preview Server</h1>`,
        _sceneName ? `<div class="active"><strong>Active preview:</strong> <a href="/">${_sceneName}</a> — <a href="/">View</a></div>` : "",
        `<h2>Available Scenes</h2>`,
        `<ul>${sceneLinks}</ul>`,
        `<p><small>The preview always reflects the <strong>latest</strong> scene state from the MCP server.</small></p>`,
        `</body></html>`,
    ].join("\n");
}

// ═══════════════════════════════════════════════════════════════════════════
//  Server lifecycle
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Start the preview server.
 *
 * @param manager  The SceneManager instance (shared with the MCP server)
 * @param sceneName  Which scene to serve at the root `/`
 * @param port  Port to listen on (default: 8765)
 * @returns A promise that resolves to the preview URL, or rejects on error.
 */
export async function startPreview(manager: SceneManager, sceneName: string, port: number = 8765): Promise<string> {
    // If already running on the same port, just update the scene name and reuse
    if (_server && _server.listening && _port === port) {
        _manager = manager;
        _sceneName = sceneName;
        const url = `http://localhost:${_port}`;
        // eslint-disable-next-line no-console
        console.error(`[preview] Reusing existing server — switched to "${sceneName}" at ${url}`);
        return url;
    }

    // Stop any existing server first and wait for the port to be released
    if (_server && _server.listening) {
        await stopPreview();
    }

    _manager = manager;
    _sceneName = sceneName;
    _port = port;

    return await new Promise((resolve, reject) => {
        const srv = http.createServer((req, res) => {
            const url = new URL(req.url ?? "/", `http://localhost:${_port}`);
            const pathname = url.pathname;

            // CORS headers (for dev convenience)
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
            if (req.method === "OPTIONS") {
                res.writeHead(204);
                res.end();
                return;
            }

            // ── Route: /  or /index.html — serve the active scene ──────────
            if (pathname === "/" || pathname === "/index.html") {
                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache, no-store" });
                res.end(generatePreviewHtml(_manager!, _sceneName));
                return;
            }

            // ── Route: /scenes — list all scenes ───────────────────────────
            if (pathname === "/scenes") {
                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache, no-store" });
                res.end(generateStatusPage(_manager!));
                return;
            }

            // ── Route: /scene/:name — preview a specific scene ─────────────
            if (pathname.startsWith("/scene/")) {
                const name = decodeURIComponent(pathname.slice("/scene/".length));
                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache, no-store" });
                res.end(generatePreviewHtml(_manager!, name));
                return;
            }

            // ── Route: /api/scene.json — raw scene JSON ────────────────────
            if (pathname === "/api/scene.json") {
                const json = _manager!.exportJSON(_sceneName);
                if (!json) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: `Scene "${_sceneName}" not found` }));
                    return;
                }
                res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-cache, no-store" });
                res.end(json);
                return;
            }

            // ── Route: /api/code — raw generated code ──────────────────────
            if (pathname === "/api/code") {
                const code = _manager!.exportCode(_sceneName, {
                    wrapInFunction: true,
                    functionName: "createScene",
                    includeHtmlBoilerplate: false,
                    includeEngineSetup: true,
                    includeRenderLoop: true,
                    format: "umd",
                    enableCollisionCallbacks: false,
                });
                if (!code) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: `Scene "${_sceneName}" not found` }));
                    return;
                }
                res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-store" });
                res.end(code);
                return;
            }

            // ── 404 ────────────────────────────────────────────────────────
            res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
            res.end(
                [
                    `<!DOCTYPE html><html><body style="font-family:system-ui;background:#1e1e2e;color:#cdd6f4;margin:40px auto;max-width:600px;">`,
                    `<h1 style="color:#f38ba8;">404 — Not Found</h1>`,
                    `<p>Routes: <a href="/" style="color:#a6e3a1;">/</a> (preview), `,
                    `<a href="/scenes" style="color:#a6e3a1;">/scenes</a> (list), `,
                    `<a href="/api/scene.json" style="color:#a6e3a1;">/api/scene.json</a>, `,
                    `<a href="/api/code" style="color:#a6e3a1;">/api/code</a></p>`,
                    `</body></html>`,
                ].join("")
            );
        });

        srv.on("error", (err: NodeJS.ErrnoException) => {
            if (err.code === "EADDRINUSE") {
                reject(new Error(`Port ${_port} is already in use. Try a different port.`));
            } else {
                reject(err);
            }
        });

        srv.listen(_port, () => {
            _server = srv;
            const url = `http://localhost:${_port}`;
            // Log to stderr (not stdout) because stdout is the MCP stdio transport
            // eslint-disable-next-line no-console
            console.error(`[preview] Serving "${_sceneName}" at ${url}`);
            resolve(url);
        });
    });
}

/**
 * Stop the preview server.
 * @returns A promise that resolves when the server is shut down.
 */
export async function stopPreview(): Promise<void> {
    return await new Promise((resolve) => {
        if (!_server || !_server.listening) {
            _server = null;
            resolve();
            return;
        }
        _server.close(() => {
            // eslint-disable-next-line no-console
            console.error("[preview] Server stopped.");
            _server = null;
            _sceneName = "";
            _port = 0;
            _manager = null;
            resolve();
        });
    });
}

/**
 * Change which scene is being previewed (without restarting the server).
 * @param sceneName The name of the scene to preview
 */
export function setPreviewScene(sceneName: string): void {
    _sceneName = sceneName;
}
