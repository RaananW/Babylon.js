/**
 * Vite dev server entry point for the Flow Graph Editor.
 *
 * Uses dynamic import so the editor module graph loads only after
 * the CDN bootstrap has set window.BABYLON.
 */
type ShowArgs = Parameters<(typeof import("./flowGraphEditor"))["FlowGraphEditor"]["Show"]>;

async function startEditor(args: ShowArgs) {
    const { FlowGraphEditor } = await import("./flowGraphEditor");
    FlowGraphEditor.Show(...args);
}

const w = window as unknown as Record<string, unknown>;
if (Array.isArray(w["__viteFlowGraphEditorArgs"])) {
    void startEditor(w["__viteFlowGraphEditorArgs"] as ShowArgs);
} else {
    window.addEventListener(
        "babylonFlowGraphEditorReady",
        (e: Event) => {
            void startEditor((e as CustomEvent<{ args: ShowArgs }>).detail.args);
        },
        { once: true }
    );
}
