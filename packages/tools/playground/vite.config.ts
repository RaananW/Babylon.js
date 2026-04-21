import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
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
        inspector: path.resolve("../../dev/inspector/dist"),
    },
    productionExternals: {
        babylonjs: "BABYLON",
        "babylonjs-inspector": "BABYLON.Inspector",
    },
});

export default defineConfig({
    ...base,
    plugins: [
        react(),
        svgr(),
        // Monaco workers are set up via src/monacoWorkerSetup.ts (imported as a side-effect
        // in vite-main.ts) which uses Vite's native ?worker URL pattern. This avoids the
        // vite-plugin-monaco-editor dependency on require.resolve which fails when
        // monaco-editor's exports field restricts subpath resolution.
    ],
    resolve: {
        ...base.resolve,
        alias: {
            ...base.resolve?.alias,
            // Compat shim: redirect Monaco's defaultDocumentColorsComputer to our
            // Safari-safe version that avoids negative lookbehind regex.
            "monaco-editor/esm/vs/editor/common/modes/supports/defaultDocumentColorsComputer.js":
                monacoColorComputerShim,
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
        exclude: [...(base.optimizeDeps?.exclude ?? []), "monaco-editor"],
    },
});
