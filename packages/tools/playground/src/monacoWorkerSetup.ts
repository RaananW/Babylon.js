/**
 * Monaco Editor web worker setup for the Vite dev server.
 *
 * webpack's MonacoWebpackPlugin injected MonacoEnvironment automatically.
 * For Vite, we configure it manually using Vite's native Worker URL pattern.
 *
 * IMPORTANT: This file must be imported as a side-effect BEFORE any monaco-editor
 * imports so that MonacoEnvironment is set up before Monaco initialises its workers.
 */

// Vite resolves these URLs at build time and emits the worker scripts as
// separate chunks.  At runtime the browser creates the workers from those URLs.
const EditorWorkerUrl = new URL("monaco-editor/esm/vs/editor/editor.worker.js", import.meta.url);
const TsWorkerUrl = new URL("monaco-editor/esm/vs/language/typescript/ts.worker.js", import.meta.url);

(self as typeof globalThis).MonacoEnvironment = {
    getWorkerUrl(_workerId: string, label: string): string {
        if (label === "typescript" || label === "javascript") {
            return TsWorkerUrl.href;
        }
        return EditorWorkerUrl.href;
    },
};
