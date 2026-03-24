/* eslint-disable @typescript-eslint/naming-convention */
/**
 * PreviewServer — built-in HTTP server that serves a glTF document from
 * the MCP server's in-memory state via the Babylon.js Sandbox.
 *
 * Design:
 * ───────
 * 1. Uses Node's built-in `http` module (zero external dependencies).
 * 2. Regenerates the GLB on every request — the preview always reflects
 *    the latest in-memory state without needing a restart.
 * 3. Singleton — only one preview server runs at a time.
 * 4. Non-blocking — runs in the background alongside the MCP stdio transport.
 *
 * The server exposes several routes:
 * - `GET /model.glb`     — serves the active document as a GLB binary
 * - `GET /model.gltf`    — serves the active document as glTF JSON
 * - `GET /api/info`      — returns a JSON summary of the active document
 * - `GET /`              — redirects to the Sandbox URL
 */

import * as http from "http";
import type { GltfManager } from "./gltfManager.js";

// ═══════════════════════════════════════════════════════════════════════════
//  State
// ═══════════════════════════════════════════════════════════════════════════

let _server: http.Server | null = null;
let _port: number = 0;
let _docName: string = "";
let _manager: GltfManager | null = null;
let _version: number = 0;

const SANDBOX_BASE = "https://sandbox.babylonjs.com";

// ═══════════════════════════════════════════════════════════════════════════
//  Public queries
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Whether the preview server is currently running.
 */
export function isPreviewRunning(): boolean {
    return _server !== null && _server.listening;
}

/**
 * Returns the local server URL, or null if not running.
 */
export function getPreviewServerUrl(): string | null {
    if (!isPreviewRunning()) {
        return null;
    }
    return `http://localhost:${_port}`;
}

/**
 * Returns the full Sandbox URL that loads the current document, or null.
 */
export function getSandboxUrl(): string | null {
    const serverUrl = getPreviewServerUrl();
    if (!serverUrl) {
        return null;
    }
    _version++;
    return `${SANDBOX_BASE}?assetUrl=${serverUrl}/model.glb?v=${_version}`;
}

/**
 * Returns the document name currently being previewed.
 */
export function getPreviewDocName(): string | null {
    if (!isPreviewRunning()) {
        return null;
    }
    return _docName;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Lifecycle
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Start the preview server.
 *
 * @param manager   The GltfManager instance
 * @param docName   Name of the glTF document to serve
 * @param port      Port to listen on (default: 8766)
 * @returns The Sandbox URL to open in a browser
 */
export async function startPreview(manager: GltfManager, docName: string, port: number = 8766): Promise<string> {
    // If already running on the same port, just switch the document
    if (_server && _server.listening && _port === port) {
        _manager = manager;
        _docName = docName;
        const url = getSandboxUrl()!;
        // eslint-disable-next-line no-console
        console.error(`[gltf-preview] Reusing server — switched to "${docName}"`);
        return url;
    }

    // Stop any existing server first
    if (_server && _server.listening) {
        await stopPreview();
    }

    _manager = manager;
    _docName = docName;
    _port = port;

    return await new Promise((resolve, reject) => {
        const srv = http.createServer((req, res) => {
            const url = new URL(req.url ?? "/", `http://localhost:${_port}`);
            const pathname = url.pathname;

            // CORS — required for the Sandbox to fetch from localhost
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type");
            if (req.method === "OPTIONS") {
                res.writeHead(204);
                res.end();
                return;
            }

            // ── /model.glb — serve the document as GLB ─────────────────
            if (pathname === "/model.glb") {
                const glb = _manager!.exportGlb(_docName);
                if (!glb) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: `No document "${_docName}"` }));
                    return;
                }
                res.writeHead(200, {
                    "Content-Type": "model/gltf-binary",
                    "Content-Length": String(glb.length),
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    Pragma: "no-cache",
                    Expires: "0",
                });
                res.end(glb);
                return;
            }

            // ── /model.gltf — serve as JSON ────────────────────────────
            if (pathname === "/model.gltf") {
                const json = _manager!.exportJson(_docName);
                if (!json) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: `No document "${_docName}"` }));
                    return;
                }
                res.writeHead(200, {
                    "Content-Type": "model/gltf+json",
                    "Cache-Control": "no-cache, no-store",
                });
                res.end(json);
                return;
            }

            // ── /api/info — quick document summary ─────────────────────
            if (pathname === "/api/info") {
                const summary = _manager!.describeGltf(_docName);
                if (!summary || summary.startsWith("Error")) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: `No document "${_docName}"` }));
                    return;
                }
                res.writeHead(200, {
                    "Content-Type": "text/plain; charset=utf-8",
                    "Cache-Control": "no-cache, no-store",
                });
                res.end(summary);
                return;
            }

            // ── / — redirect to the Sandbox ────────────────────────────
            if (pathname === "/" || pathname === "/index.html") {
                const sandboxUrl = getSandboxUrl()!;
                res.writeHead(302, { Location: sandboxUrl });
                res.end();
                return;
            }

            // ── 404 ────────────────────────────────────────────────────
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not found. Routes: /model.glb, /model.gltf, /api/info, /");
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
            const sandboxUrl = getSandboxUrl()!;
            // eslint-disable-next-line no-console
            console.error(`[gltf-preview] Serving "${_docName}" at http://localhost:${_port}`);
            // eslint-disable-next-line no-console
            console.error(`[gltf-preview] Sandbox: ${sandboxUrl}`);
            resolve(sandboxUrl);
        });
    });
}

/**
 * Stop the preview server.
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
            console.error("[gltf-preview] Server stopped.");
            _server = null;
            _docName = "";
            _port = 0;
            _manager = null;
            resolve();
        });
    });
}

/**
 * Change which document is being served (without restarting).
 */
export function setPreviewDocument(docName: string): void {
    _docName = docName;
}
