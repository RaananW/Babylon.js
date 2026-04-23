import { defineConfig } from "vite";
import path from "path";
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

const base = commonDevViteConfiguration({
    port: parseInt(process.env.SANDBOX_PORT ?? "1339"),
    aliases: {
        "shared-ui-components": path.resolve("../../dev/sharedUiComponents/dist"),
        core: path.resolve("../../dev/core/dist"),
        gui: path.resolve("../../dev/gui/dist"),
        loaders: path.resolve("../../dev/loaders/dist"),
        serializers: path.resolve("../../dev/serializers/dist"),
        materials: path.resolve("../../dev/materials/dist"),
        addons: path.resolve("../../dev/addons/dist"),
    },
    productionExternals: {
        babylonjs: "BABYLON",
        "babylonjs-gui": "BABYLON.GUI",
        "babylonjs-loaders": "BABYLON",
        "babylonjs-serializers": "BABYLON",
        "babylonjs-materials": "BABYLON",
        "babylonjs-addons": "ADDONS",
    },
});

export default defineConfig({
    ...base,
    plugins: [
        ...(base.plugins ?? []),
        {
            // Generates `babylon.sandbox.js` at build time.
            //
            // The production HTML (public/index.html) uses a CDN bootstrap that
            // loads `babylon.sandbox.js` then calls BABYLON.Sandbox.Show().
            // In the webpack era this file was the compiled bundle. With Vite the
            // bundle is ES modules in assets/. This plugin generates a shim that:
            //   1. Injects <script type="module"> and <link rel="stylesheet"> tags
            //      for the Vite-built chunks (with correct hashed filenames).
            //   2. Registers a BABYLON.Sandbox.Show stub that captures args and
            //      dispatches an event picked up by main.ts.
            name: "generate-sandbox-shim",
            apply: "build" as const,
            generateBundle(_options, bundle) {
                const entryChunk = Object.values(bundle).find((c) => c.type === "chunk" && c.isEntry);
                const cssAssets = Object.values(bundle).filter((a) => a.type === "asset" && a.fileName.endsWith(".css"));

                const moduleSrc = entryChunk ? `./${entryChunk.fileName}` : "./assets/index.js";
                const cssInjections = cssAssets
                    .map((a) => `var l=document.createElement("link");l.rel="stylesheet";l.href="${`./${a.fileName}`}";document.head.appendChild(l);`)
                    .join("\n    ");

                const shimCode = `(function () {
    // Inject Vite-built CSS
    ${cssInjections}
    // Load Vite-built ES module entry
    var s = document.createElement("script");
    s.type = "module";
    s.crossOrigin = "";
    s.src = "${moduleSrc}";
    document.head.appendChild(s);
    // Register BABYLON.Sandbox.Show shim for the CDN bootstrap (index.js)
    var B = window.BABYLON || (window.BABYLON = {});
    B.Sandbox = {
        Show: function (hostElement, versionInfo) {
            var args = [hostElement, versionInfo];
            window.__viteSandboxArgs = args;
            window.dispatchEvent(new CustomEvent("babylonSandboxReady", { detail: { args: args } }));
        },
    };
})();
`;
                this.emitFile({ type: "asset", fileName: "babylon.sandbox.js", source: shimCode });
            },
        },
    ],
});
