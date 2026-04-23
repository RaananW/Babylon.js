/**
 * Vite dev server entry point for the Node Render Graph Editor.
 *
 * Uses dynamic import so the editor module graph loads only after
 * the CDN bootstrap has set window.BABYLON.
 */
type ShowArgs = Parameters<(typeof import("./nodeRenderGraphEditor"))["NodeRenderGraphEditor"]["Show"]>;

async function startEditor(args: ShowArgs) {
    const { NodeRenderGraphEditor } = await import("./nodeRenderGraphEditor");
    NodeRenderGraphEditor.Show(...args);
}

const w = window as unknown as Record<string, unknown>;
if (Array.isArray(w["__viteNodeRenderGraphEditorArgs"])) {
    void startEditor(w["__viteNodeRenderGraphEditorArgs"] as ShowArgs);
} else {
    window.addEventListener(
        "babylonNodeRenderGraphEditorReady",
        (e: Event) => {
            void startEditor((e as CustomEvent<{ args: ShowArgs }>).detail.args);
        },
        { once: true }
    );
}
