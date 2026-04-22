import { defineConfig } from "vite";
import fs from "fs";
import path from "path";
import svgr from "vite-plugin-svgr";
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

// The defaultDocumentColorsComputer in Monaco core uses negative lookbehind regexes
// unsupported in older Safari. Redirect to our compat shim (same approach as webpack's
// NormalModuleReplacementPlugin in the old webpack.config.js).
const monacoColorComputerShim = path.resolve(__dirname, "src/tools/monaco/compat/defaultDocumentColorsComputer.ts");

const base = commonDevViteConfiguration({
    port: parseInt(process.env.PLAYGROUND_PORT ?? "1338"),
    aliases: {
        "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
        core: path.resolve("../../dev/core/dist"),
        // inspector-v2 is the modern inspector (package name @dev/inspector, folder inspector-v2).
        // The legacy inspector folder (packages/dev/inspector) is @dev/inspector-legacy.
        inspector: path.resolve("../../dev/inspector-v2/dist"),
        // Inspector v2 imports from these packages sub-paths.
        loaders: path.resolve("../../dev/loaders/dist"),
        materials: path.resolve("../../dev/materials/dist"),
        addons: path.resolve("../../dev/addons/dist"),
        gui: path.resolve("../../dev/gui/dist"),
        serializers: path.resolve("../../dev/serializers/dist"),
        "gui-editor": path.resolve("../guiEditor/dist"),
    },
    productionExternals: {
        babylonjs: "BABYLON",
        "babylonjs-inspector": "BABYLON.Inspector",
    },
});

export default defineConfig({
    ...base,
    plugins: [
        // Spread base plugins first — this includes react() and the cssModuleNamespaceInteropPlugin
        // that rewrites `import * as styles from "*.module.scss"` to `import styles from "*.module.scss"`
        // (needed because Vite CSS modules emit a default export, not a namespace).
        ...(base.plugins ?? []),
        // exportAsDefault + include: vite-plugin-svgr v5 changed its default include
        // pattern to '**/*.svg?react'. Playground imports SVGs as plain default imports
        // (e.g. `import Icon from "./icon.svg"`), so we must explicitly include '**/*.svg'
        // and set exportAsDefault so the default export is the React component.
        svgr({ include: "**/*.svg", exportAsDefault: true }),
        // Monaco workers are set up via src/monacoWorkerSetup.ts (imported as a side-effect
        // in vite-main.ts) which uses Vite's native ?worker URL pattern. This avoids the
        // vite-plugin-monaco-editor dependency on require.resolve which fails when
        // monaco-editor's exports field restricts subpath resolution.
        {
            // Serves a stripped version of public/index.js that only defines the Versions
            // global — without the CDN bootstrap / loadScriptAsync calls. Babylon is imported
            // directly from the monorepo in Vite dev mode so CDN scripts are not needed, but
            // CommandBarComponent / HamburgerMenu need the Versions dropdown data at runtime.
            name: "playground-versions-provider",
            configureServer(server) {
                server.middlewares.use("/index.js", (_req, res) => {
                    const src = fs.readFileSync(path.resolve(__dirname, "public/index.js"), "utf-8");
                    // Strip everything from the CDN bootstrap onwards, keeping only the Versions definition.
                    const stopAt = "\nconst fallbackUrl";
                    const stopIdx = src.indexOf(stopAt);
                    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
                    res.end(stopIdx > 0 ? src.substring(0, stopIdx) : src);
                });
            },
        },
    ],
    resolve: {
        ...base.resolve,
        alias: {
            ...base.resolve?.alias,
            // Compat shim: redirect Monaco's defaultDocumentColorsComputer to our
            // Safari-safe version that avoids negative lookbehind regex.
            "monaco-editor/esm/vs/editor/common/modes/supports/defaultDocumentColorsComputer.js": monacoColorComputerShim,
        },
    },
    build: {
        ...base.build,
        rollupOptions: {
            ...base.build?.rollupOptions,
            input: {
                index: path.resolve(__dirname, "index.html"),
                debug: path.resolve(__dirname, "debug.html"),
                frame: path.resolve(__dirname, "frame.html"),
                full: path.resolve(__dirname, "full.html"),
            },
        },
    },
    optimizeDeps: {
        ...base.optimizeDeps,
        exclude: [
            // Workspace packages are served as individual files so all aliases
            // resolve to the same module instances (required for correct module
            // identity — e.g. AddAnimationExtensions must patch the same Scene
            // class that window.BABYLON.Scene refers to).
            ...(base.optimizeDeps?.exclude ?? []),
            // Monaco must be excluded: pre-bundling it bundles the worker entry
            // points into the main thread chunk, breaking web worker isolation.
            "monaco-editor",
            // Types-only package with no JS entry.
            "babylonjs-gltf2interface",
        ],
    },
    server: {
        ...base.server,
        fs: {
            // Allow serving files from the monorepo root (needed for Monaco's codicon.ttf
            // which lives in node_modules/monaco-editor at the workspace root, not under
            // the playground package root).
            allow: [path.resolve(__dirname, "../../..")],
        },
        // Pre-transform the main entry and its top-level imports on server start.
        // This fills Vite's transform cache before the browser makes its first
        // request, so the initial page load is served from cache rather than
        // triggering on-demand compilation for every file.
        warmup: {
            clientFiles: ["./src/vite-main.ts", "./src/playground.tsx", "./src/globalState.ts"],
        },
    },
});
