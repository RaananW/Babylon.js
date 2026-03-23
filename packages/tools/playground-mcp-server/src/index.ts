#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/**
 * Babylon.js Playground MCP Server (babylonjs-playground)
 * ──────────────
 * A Model Context Protocol server that exposes tools for AI-driven
 * Babylon.js Playground code editing. An AI agent (or any MCP client) can:
 *
 *   • Create / manage playground documents
 *   • Read and write playground code
 *   • Load snippets from the Babylon.js Snippet Server
 *   • Push code changes to a connected Playground editor in real time via SSE
 *
 * Transport: stdio  (the standard MCP transport for local tool servers)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { CreateErrorResponse, CreateTextResponse } from "../../mcpServerCore/dist/index.js";

import { PlaygroundManager } from "./playgroundManager.js";
import { LoadSnippet, SaveSnippet } from "@tools/snippet-loader";
import type { IPlaygroundSnippetResult } from "@tools/snippet-loader";
import { startSessionServer, createSession, notifySessionUpdate, getSessionUrl, getSessionForPlayground, closeSessionForPlayground } from "./sessionServer.js";

// ─── Singleton playground manager ─────────────────────────────────────────
const manager = new PlaygroundManager();

/**
 * Notify SSE subscribers if a session exists for the given playground.
 * @param playgroundName - The playground name to check for active sessions.
 */
function _notifyIfSession(playgroundName: string): void {
    const sid = getSessionForPlayground(playgroundName);
    if (sid) {
        notifySessionUpdate(sid);
    }
}

// ─── MCP Server ───────────────────────────────────────────────────────────
const server = new McpServer(
    {
        name: "babylonjs-playground",
        version: "1.0.0",
    },
    {
        instructions: [
            "You write Babylon.js playground code. Workflow: create_playground → get_code / set_code → iterate.",
            "Playgrounds use ES module format: the createScene function MUST be exported with `export const createScene = function () { ... };`.",
            "Globals available: `engine` (Engine) and `canvas` (HTMLCanvasElement). Do NOT call engine.runRenderLoop() — the playground handles that.",
            "You can load existing playground snippets by ID using load_snippet.",
            "Use get_code to read the current code before making modifications. Use set_code to replace the full code.",
            "When connected to a live playground session, every set_code call automatically pushes updates to the editor.",
        ].join(" "),
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Resources (read-only reference data)
// ═══════════════════════════════════════════════════════════════════════════

server.registerResource("playground-template-js", "playground://template/js", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/plain",
            text: [
                "// Standard Babylon.js Playground template (JavaScript)",
                "// Globals available: engine (Engine), canvas (HTMLCanvasElement)",
                "",
                "export const createScene = function () {",
                "    const scene = new BABYLON.Scene(engine);",
                '    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);',
                "    camera.setTarget(BABYLON.Vector3.Zero());",
                "    camera.attachControl(canvas, true);",
                '    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);',
                '    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2 }, scene);',
                "    sphere.position.y = 1;",
                '    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);',
                "    return scene;",
                "};",
            ].join("\n"),
        },
    ],
}));

server.registerResource("playground-template-ts", "playground://template/ts", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/plain",
            text: [
                "// Standard Babylon.js Playground template (TypeScript)",
                "// Globals available: engine (Engine), canvas (HTMLCanvasElement)",
                "",
                "export const createScene = function (): BABYLON.Scene {",
                "    const scene = new BABYLON.Scene(engine);",
                '    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);',
                "    camera.setTarget(BABYLON.Vector3.Zero());",
                "    camera.attachControl(canvas, true);",
                '    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);',
                '    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2 }, scene);',
                "    sphere.position.y = 1;",
                '    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);',
                "    return scene;",
                "};",
            ].join("\n"),
        },
    ],
}));

server.registerResource("playground-conventions", "playground://conventions", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/plain",
            text: [
                "Babylon.js Playground Conventions:",
                "",
                "1. The playground provides two global variables: `engine` (a Babylon.js Engine) and `canvas` (the rendering HTMLCanvasElement).",
                "2. Your code must define a `createScene` function that returns a BABYLON.Scene.",
                "3. The engine and render loop are managed by the playground — you do NOT call engine.runRenderLoop() yourself.",
                "4. All Babylon.js classes are available under the `BABYLON` namespace (e.g. BABYLON.Vector3, BABYLON.MeshBuilder).",
                "5. For async scenes, you can return a Promise<Scene> from createScene.",
                "6. The playground supports both JavaScript and TypeScript.",
                "7. Common patterns:",
                "   - Create camera, attach to canvas",
                "   - Create lights",
                "   - Create meshes, materials, textures",
                "   - Set up animations, physics, particles",
                "   - Return the scene",
            ].join("\n"),
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Prompts (reusable templates)
// ═══════════════════════════════════════════════════════════════════════════

server.registerPrompt("new-playground", { description: "Create a new Babylon.js playground with a basic scene" }, () => ({
    messages: [
        {
            role: "user" as const,
            content: {
                type: "text" as const,
                text: "Create a new Babylon.js playground with a basic scene containing a camera, light, and a sphere. Use create_playground to start, then set_code to write the code. Make sure to follow the standard playground pattern with a createScene function.",
            },
        },
    ],
}));

server.registerPrompt(
    "fix-playground",
    {
        description: "Fix bugs in existing playground code",
        argsSchema: { playgroundName: z.string().describe("Name of the playground to fix") },
    },
    ({ playgroundName }) => ({
        messages: [
            {
                role: "user" as const,
                content: {
                    type: "text" as const,
                    text: `Read the code from playground "${playgroundName}" using get_code, analyze it for bugs or issues, and fix them using set_code. Common issues include: missing scene return, incorrect camera setup, missing light, type errors, and API misuse.`,
                },
            },
        ],
    })
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools
// ═══════════════════════════════════════════════════════════════════════════

// ── Playground lifecycle ────────────────────────────────────────────────

server.registerTool(
    "create_playground",
    {
        description:
            "Create a new playground document. Optionally provide initial code; otherwise a standard Babylon.js template is used. " +
            "A live session is automatically started so the Playground editor can connect for real-time sync.",
        inputSchema: {
            playgroundName: z.string().describe("Unique name for this playground"),
            language: z.enum(["JS", "TS"]).optional().describe("Language: JS (default) or TS"),
            code: z.string().optional().describe("Initial code. If omitted, a standard template is used."),
        },
    },
    async ({ playgroundName, language, code }) => {
        const lang = language ?? "JS";
        const result = manager.createPlayground(playgroundName, lang, code);
        if (result !== "OK") {
            return CreateErrorResponse(`Error: ${result}`);
        }

        // Auto-start session
        let sessionInfo: string;
        try {
            const port = await startSessionServer(manager);
            const sessionId = createSession(playgroundName);
            const sessionUrl = getSessionUrl(sessionId, port);
            sessionInfo = `\n\nMCP Session URL: ${sessionUrl}\nPaste this URL in the Playground's "Connect to MCP Session" panel to see live updates.`;
        } catch (e) {
            sessionInfo = `\n\n(Session server could not start: ${(e as Error).message})`;
        }

        const doc = manager.getPlayground(playgroundName)!;
        return CreateTextResponse(`Created playground "${playgroundName}" (${lang}, ${doc.code.length} chars).${sessionInfo}`);
    }
);

server.registerTool(
    "list_playgrounds",
    {
        description: "List all playground documents currently in memory.",
        inputSchema: {},
    },
    async () => {
        const names = manager.listPlaygrounds();
        if (names.length === 0) {
            return CreateTextResponse("No playgrounds in memory. Use create_playground to create one.");
        }
        const lines = names.map((n) => {
            const doc = manager.getPlayground(n)!;
            const sid = getSessionForPlayground(n);
            return `• ${n} (${doc.language}, ${doc.code.length} chars)${sid ? ` [session: ${sid}]` : ""}`;
        });
        return CreateTextResponse(`Playgrounds in memory:\n${lines.join("\n")}`);
    }
);

server.registerTool(
    "delete_playground",
    {
        description: "Delete a playground document from memory. Also closes any active session.",
        inputSchema: {
            playgroundName: z.string().describe("Name of the playground to delete"),
        },
    },
    async ({ playgroundName }) => {
        closeSessionForPlayground(playgroundName);
        const result = manager.deletePlayground(playgroundName);
        if (result !== "OK") {
            return CreateErrorResponse(`Error: ${result}`);
        }
        return CreateTextResponse(`Deleted playground "${playgroundName}".`);
    }
);

// ── Code read/write ─────────────────────────────────────────────────────

server.registerTool(
    "get_code",
    {
        description: "Get the current code from a playground. " + "Always call this before making modifications so you have the latest version.",
        inputSchema: {
            playgroundName: z.string().describe("Name of the playground"),
        },
    },
    async ({ playgroundName }) => {
        const doc = manager.getPlayground(playgroundName);
        if (!doc) {
            return CreateErrorResponse(`Error: Playground "${playgroundName}" not found.`);
        }
        return CreateTextResponse(
            `Playground "${playgroundName}" (${doc.language}, ${doc.code.length} chars):\n\n\`\`\`${doc.language === "TS" ? "typescript" : "javascript"}\n${doc.code}\n\`\`\``
        );
    }
);

server.registerTool(
    "set_code",
    {
        description:
            "Replace the entire code of a playground. " +
            "If a live session is active, the new code is automatically pushed to the connected editor. " +
            "Always use get_code first to understand the current state before replacing.",
        inputSchema: {
            playgroundName: z.string().describe("Name of the playground"),
            code: z.string().describe("The complete new code to set"),
        },
    },
    async ({ playgroundName, code }) => {
        const result = manager.setCode(playgroundName, code);
        if (result !== "OK") {
            return CreateErrorResponse(`Error: ${result}`);
        }
        _notifyIfSession(playgroundName);
        return CreateTextResponse(`Updated code for "${playgroundName}" (${code.length} chars).`);
    }
);

// ── Metadata ────────────────────────────────────────────────────────────

server.registerTool(
    "get_metadata",
    {
        description: "Get the metadata (title, description, tags, language) of a playground.",
        inputSchema: {
            playgroundName: z.string().describe("Name of the playground"),
        },
    },
    async ({ playgroundName }) => {
        const doc = manager.getPlayground(playgroundName);
        if (!doc) {
            return CreateErrorResponse(`Error: Playground "${playgroundName}" not found.`);
        }
        return CreateTextResponse(
            `Playground "${playgroundName}":\n  Language: ${doc.language}\n  Title: ${doc.title}\n  Description: ${doc.description || "(none)"}\n  Tags: ${doc.tags || "(none)"}\n  Code length: ${doc.code.length} chars`
        );
    }
);

server.registerTool(
    "set_metadata",
    {
        description: "Update the metadata (title, description, tags) of a playground.",
        inputSchema: {
            playgroundName: z.string().describe("Name of the playground"),
            title: z.string().optional().describe("New title"),
            description: z.string().optional().describe("New description"),
            tags: z.string().optional().describe("New tags (comma-separated)"),
        },
    },
    async ({ playgroundName, title, description, tags }) => {
        const result = manager.setMetadata(playgroundName, { title, description, tags });
        if (result !== "OK") {
            return CreateErrorResponse(`Error: ${result}`);
        }
        return CreateTextResponse(`Updated metadata for "${playgroundName}".`);
    }
);

// ── Snippet loading ─────────────────────────────────────────────────────

server.registerTool(
    "load_snippet",
    {
        description:
            "Load a Babylon.js playground snippet from the Snippet Server by its ID. " +
            "The snippet code is loaded into a new or existing playground document. " +
            'Snippet IDs look like "ABC123" or "ABC123#2" (with revision).',
        inputSchema: {
            playgroundName: z.string().describe("Name for the playground (creates or replaces)"),
            snippetId: z.string().describe('Snippet ID from the Babylon.js Snippet Server (e.g. "ABC123" or "ABC123#2")'),
        },
    },
    async ({ playgroundName, snippetId }) => {
        try {
            const snippetResult = await LoadSnippet(snippetId);
            if (snippetResult.type !== "playground") {
                return CreateErrorResponse(`Error: Snippet "${snippetId}" is of type "${snippetResult.type}", not a playground snippet.`);
            }
            const pgResult = snippetResult as IPlaygroundSnippetResult;
            const code = pgResult.code;
            const language = pgResult.language ?? "JS";

            // Create or replace
            if (!manager.getPlayground(playgroundName)) {
                manager.createPlayground(playgroundName, language, code);
            } else {
                manager.setCode(playgroundName, code);
            }

            _notifyIfSession(playgroundName);

            return CreateTextResponse(`Loaded snippet "${snippetId}" into "${playgroundName}" (${language}, ${code.length} chars).`);
        } catch (e) {
            return CreateErrorResponse(`Error fetching snippet "${snippetId}": ${(e as Error).message}`);
        }
    }
);

// ── File I/O ────────────────────────────────────────────────────────────

server.registerTool(
    "save_to_file",
    {
        description: "Save the playground code to a local file.",
        inputSchema: {
            playgroundName: z.string().describe("Name of the playground"),
            filePath: z.string().describe("Absolute file path to write the code to"),
        },
    },
    async ({ playgroundName, filePath }) => {
        const doc = manager.getPlayground(playgroundName);
        if (!doc) {
            return CreateErrorResponse(`Error: Playground "${playgroundName}" not found.`);
        }
        try {
            mkdirSync(dirname(filePath), { recursive: true });
            writeFileSync(filePath, doc.code, "utf-8");
            return CreateTextResponse(`Saved code to ${filePath} (${doc.code.length} chars).`);
        } catch (e) {
            return CreateErrorResponse(`Error writing file: ${(e as Error).message}`);
        }
    }
);

server.registerTool(
    "load_from_file",
    {
        description: "Load playground code from a local file into a playground document.",
        inputSchema: {
            playgroundName: z.string().describe("Name for the playground (creates or replaces)"),
            filePath: z.string().describe("Absolute file path to read the code from"),
            language: z.enum(["JS", "TS"]).optional().describe("Language: JS (default) or TS"),
        },
    },
    async ({ playgroundName, filePath, language }) => {
        try {
            const code = readFileSync(filePath, "utf-8");
            const lang = language ?? "JS";
            if (!manager.getPlayground(playgroundName)) {
                manager.createPlayground(playgroundName, lang, code);
            } else {
                manager.setCode(playgroundName, code);
            }
            _notifyIfSession(playgroundName);
            return CreateTextResponse(`Loaded ${filePath} into "${playgroundName}" (${lang}, ${code.length} chars).`);
        } catch (e) {
            return CreateErrorResponse(`Error reading file: ${(e as Error).message}`);
        }
    }
);

// ── Session management ──────────────────────────────────────────────────

server.registerTool(
    "get_session_url",
    {
        description:
            "Get the live session URL for a playground. If no session exists, one is created. " +
            "The user pastes this URL into the Playground editor's MCP Session panel to enable real-time sync.",
        inputSchema: {
            playgroundName: z.string().describe("Name of the playground"),
        },
    },
    async ({ playgroundName }) => {
        if (!manager.getPlayground(playgroundName)) {
            return CreateErrorResponse(`Error: Playground "${playgroundName}" not found.`);
        }
        try {
            const port = await startSessionServer(manager);
            const sessionId = createSession(playgroundName);
            const url = getSessionUrl(sessionId, port);
            return CreateTextResponse(`Session URL for "${playgroundName}": ${url}\n\nPaste this URL in the Playground's "Connect to MCP Session" panel.`);
        } catch (e) {
            return CreateErrorResponse(`Error starting session: ${(e as Error).message}`);
        }
    }
);

server.registerTool(
    "close_session",
    {
        description: "Close the live session for a playground, disconnecting all connected editors.",
        inputSchema: {
            playgroundName: z.string().describe("Name of the playground whose session to close"),
        },
    },
    async ({ playgroundName }) => {
        const closed = closeSessionForPlayground(playgroundName);
        if (!closed) {
            return CreateTextResponse(`No active session for "${playgroundName}".`);
        }
        return CreateTextResponse(`Closed session for "${playgroundName}".`);
    }
);

// ── Snippet server ──────────────────────────────────────────────────────

server.registerTool(
    "save_snippet",
    {
        description:
            "Save the playground code to the Babylon.js Snippet Server and return the snippet ID and version. " +
            "The snippet can later be loaded in the Playground via its snippet ID, or fetched with load_snippet. " +
            "To create a new revision of an existing snippet, pass the previous snippetId.",
        inputSchema: {
            playgroundName: z.string().describe("Name of the playground to save"),
            snippetId: z.string().optional().describe('Optional existing snippet ID to create a new revision of (e.g. "ABC123" or "ABC123#1")'),
            name: z.string().optional().describe("Optional human-readable title for the snippet"),
            description: z.string().optional().describe("Optional description"),
            tags: z.string().optional().describe("Optional comma-separated tags"),
        },
    },
    async ({ playgroundName, snippetId, name, description, tags }) => {
        const doc = manager.getPlayground(playgroundName);
        if (!doc) {
            return CreateErrorResponse(`Playground "${playgroundName}" not found.`);
        }
        try {
            const result = await SaveSnippet(
                { type: "playground", code: doc.code, language: doc.language, engine: "WebGL2" },
                { snippetId, metadata: { name: name ?? doc.title, description: description ?? doc.description, tags: tags ?? doc.tags } }
            );
            return CreateTextResponse(
                `Saved playground "${playgroundName}" to snippet server.\n\nSnippet ID: ${result.id}\nVersion: ${result.version}\nFull ID: ${result.snippetId}\n\nOpen in Playground: https://playground.babylonjs.com/#${result.snippetId}`
            );
        } catch (e) {
            return CreateErrorResponse(`Error saving snippet: ${(e as Error).message}`);
        }
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Start
// ═══════════════════════════════════════════════════════════════════════════

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Playground MCP server running on stdio");
