/**
 * Vite dev server entry point for the GUI Editor.
 *
 * Uses dynamic import so the editor module graph (which contains
 * `const { X } = window.BABYLON ?? {}` bindings) loads only after
 * the CDN bootstrap has set window.BABYLON.
 */
type ShowArgs = Parameters<(typeof import("./guiEditor"))["GUIEditor"]["Show"]>;

async function startEditor(args: ShowArgs) {
    const { GUIEditor } = await import("./guiEditor");
    GUIEditor.Show(...args);
}

const w = window as unknown as Record<string, unknown>;
if (Array.isArray(w["__viteGuiEditorArgs"])) {
    void startEditor(w["__viteGuiEditorArgs"] as ShowArgs);
} else {
    window.addEventListener(
        "babylonGuiEditorReady",
        (e: Event) => {
            void startEditor((e as CustomEvent<{ args: ShowArgs }>).detail.args);
        },
        { once: true }
    );
}
