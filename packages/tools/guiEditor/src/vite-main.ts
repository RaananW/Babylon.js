/**
 * Vite dev server entry point for the GUI Editor.
 *
 * This replaces the public/index.js CDN loader when developing with Vite.
 * Instead of loading babylon from a CDN, Vite serves everything as native
 * ESM from the monorepo dist/ directories via vite.config.ts aliases.
 *
 * For production CDN deployments, use:
 *   npm run build:deployment -w @tools/gui-editor
 * which uses webpack and the public/index.js CDN loader.
 */
import { GUIEditor } from "./index";

const hostElement = document.getElementById("host-element") as HTMLElement;

// Load snippet token from the URL hash (same convention as public/index.js)
const hashToken = location.hash?.replace(/^#/, "") || undefined;

GUIEditor.Show({
    hostElement,
    currentSnippetToken: hashToken,
    customSave: {
        label: "Save to snippet server",
        action: async (data: string) => {
            const snippetUrl = "https://snippet.babylonjs.com";
            const dataToSend = { payload: JSON.stringify({ gui: data }), name: "", description: "", tags: "" };
            const response = await fetch(snippetUrl + (hashToken ? "/" + hashToken : ""), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend),
            });
            const result = await response.json();
            const newToken = result.id + (result.version ? "#" + result.version : "");
            location.hash = newToken;
            return newToken;
        },
    },
    customLoad: {
        label: "Load from snippet server",
        action: async (data: string) => {
            const snippetUrl = "https://snippet.babylonjs.com";
            const response = await fetch(`${snippetUrl}/${data}`);
            const snippet = await response.json();
            return JSON.parse(snippet.payload).gui;
        },
    },
});
