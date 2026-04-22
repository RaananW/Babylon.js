import { defineConfig } from "vite";
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
        // shared-ui-components is used by React components in this package (source-level).
        "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
        // No `core` alias here — all `import { type X } from "core/..."` in this package
        // are type-only and are erased at compile time. TypeScript resolves them via the
        // root tsconfig.json paths mapping. Adding a Vite alias would cause Vite to crawl
        // core/dist (2266 files) at startup, generating 4000+ unnecessary requests.
    },
    productionExternals: {
        babylonjs: "BABYLON",
        "babylonjs-inspector": "BABYLON.Inspector",
    },
});

export default defineConfig({
    ...base,
    plugins: [
        // Spread base plugins first — includes react() and cssModuleNamespaceInteropPlugin.
        ...(base.plugins ?? []),
        svgr({ include: "**/*.svg", exportAsDefault: true }),
        {
            // Serves /babylon.playground.js — a shim replacing the webpack-built UMD bundle.
            //
            // Architecture: public/index.js (full CDN bootstrap) auto-detects localhost and
            // loads all babylon bundles from babylonServer (port 1337). After bundles load it
            // fetches /babylon.playground.js then calls BABYLON.Playground.Show(). In webpack
            // mode that file is the compiled bundle registering Playground on window.BABYLON.
            // In Vite dev mode the React app is served as ES modules; this shim captures the
            // Show() call and relays it to vite-main.ts via a CustomEvent.
            name: "playground-dev-shims",
            configureServer(server) {
                server.middlewares.use("/babylon.playground.js", (_req, res) => {
                    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
                    res.end(`(function () {
    var BABYLON = window.BABYLON;
    if (!BABYLON) { return; }
    BABYLON.Playground = {
        Show: function (hostElement, mode, version, bundles) {
            var args = [hostElement, mode, version, bundles];
            window.__vitePlaygroundArgs = args;
            window.dispatchEvent(new CustomEvent("babylonPlaygroundReady", { detail: { args: args } }));
        }
    };
})();`);
                });
            },
        },
    ],
    resolve: {
        ...base.resolve,
        alias: {
            ...base.resolve?.alias,
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
        exclude: [...(base.optimizeDeps?.exclude ?? []), "monaco-editor", "babylonjs-gltf2interface"],
    },
    server: {
        ...base.server,
        fs: {
            allow: [path.resolve(__dirname, "../../..")],
        },
        warmup: {
            clientFiles: ["./src/vite-main.ts", "./src/playground.tsx", "./src/globalState.ts"],
        },
    },
});
