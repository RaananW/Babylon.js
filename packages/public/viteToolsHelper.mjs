/**
 * Shared Vite configuration helpers for Babylon.js tool dev servers.
 *
 * Mirrors the role that commonDevWebpackConfiguration played in webpackTools.ts
 * but targets Vite's native-ESM dev server for dramatically faster start times
 * and HMR performance.
 *
 * Usage in a vite.config.ts:
 *   import { commonDevViteConfiguration } from "../../../public/viteToolsHelper.mjs";
 *   export default commonDevViteConfiguration({ port: 1341, aliases: { ... } });
 */

import react from "@vitejs/plugin-react";
import { resolve, join } from "path";

// ---------------------------------------------------------------------------
// Externals → globals mapping (same as umdGlobals in rollupUMDHelper.mjs)
// Used for production build.rollupOptions only.
// ---------------------------------------------------------------------------
export const babylonGlobals = {
    babylonjs: "BABYLON",
    "babylonjs-gui": "BABYLON.GUI",
    "babylonjs-loaders": "BABYLON",
    "babylonjs-serializers": "BABYLON",
    "babylonjs-materials": "BABYLON",
    "babylonjs-post-process": "BABYLON",
    "babylonjs-procedural-textures": "BABYLON",
    "babylonjs-inspector": "INSPECTOR",
    "babylonjs-gui-editor": "BABYLON.GuiEditor",
    "babylonjs-accessibility": "BABYLON.Accessibility",
    "babylonjs-addons": "ADDONS",
    "babylonjs-ktx2decoder": "KTX2DECODER",
};

/**
 * Vite plugin that maps bare dev-package imports (e.g. `core/Engines/engine`)
 * to a virtual module backed by a browser global (e.g. `window.BABYLON`).
 *
 * This preserves the "load babylon from CDN, tool bundle references globals"
 * architecture used by the babylon CDN loaders in public/index.js.
 *
 * @param {Record<string, string>} externals
 *   Map from dev-package prefix to global variable path.
 *   E.g. `{ core: "BABYLON", gui: "BABYLON.GUI" }`
 */
export function babylonDevExternalsPlugin(externals) {
    const VIRTUAL_PREFIX = "\0babylon-ext:";

    return {
        name: "babylon-dev-externals",

        resolveId(source) {
            // Handle gltf2interface
            if (source.includes("babylonjs-gltf2interface")) {
                return `${VIRTUAL_PREFIX}babylonjs-gltf2interface:BABYLON.GLTF2`;
            }
            const pkg = source.split("/")[0];
            const globalVar = externals[pkg];
            if (globalVar !== undefined) {
                return `${VIRTUAL_PREFIX}${source}:${globalVar}`;
            }
            return null;
        },

        load(id) {
            if (!id.startsWith(VIRTUAL_PREFIX)) return null;

            // Extract global path (e.g. "BABYLON.GUI")
            const globalVar = id.slice(id.lastIndexOf(":") + 1);

            // Build a chain of property accesses from a safe global root:
            // "BABYLON.GUI" → (globalThis ?? window)["BABYLON"]["GUI"]
            const parts = globalVar.split(".");
            const root = `(typeof globalThis !== "undefined" ? globalThis : window)`;
            const chain = parts.reduce((acc, key) => `${acc}["${key}"]`, root);

            return [
                `const __g__ = ${chain};`,
                `export default __g__;`,
                // Re-export all enumerable own properties as named exports so that
                // "import { Engine } from 'core/...'" picks up Engine from BABYLON.
                `if (__g__ && typeof __g__ === "object") {`,
                `  for (const __k__ of Object.getOwnPropertyNames(__g__)) {`,
                `    if (__k__ !== "default" && /^[A-Za-z_$]/.test(__k__)) {`,
                `      Object.defineProperty(__babel_reexports__ = __babel_reexports__ || {}, __k__, { get: () => __g__[__k__] });`,
                `    }`,
                `  }`,
                `}`,
            ].join("\n");
        },
    };
}

// ---------------------------------------------------------------------------
// Main configuration factory
// ---------------------------------------------------------------------------

/**
 * Creates a Vite configuration for a Babylon.js tool dev server.
 *
 * Dev server strategy: all babylon dev-package imports (core, gui, …) are
 * resolved via `resolve.alias` to their pre-compiled `dist/` or `src/`
 * directories.  Vite serves these as native ESM — no CDN server needed.
 *
 * Production build strategy: babylonjs packages are excluded via
 * `build.rollupOptions.external` + `output.globals` so the bundle remains
 * small and the CDN loader mechanism continues to work for deployed pages.
 *
 * @param {object} options
 * @param {number} options.port                Dev server port.
 * @param {Record<string,string>} options.aliases
 *   Alias entries: key = bare module prefix, value = absolute path to resolve.
 *   E.g. `{ "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src") }`
 * @param {string[]} [options.staticDirs]      Extra static file directories.
 * @param {boolean} [options.enableHttps]      Enable HTTPS for the dev server.
 * @param {boolean} [options.enableHmr]        Enable HMR (defaults true).
 * @param {Record<string,string>} [options.productionExternals]
 *   Externals for `vite build`: map from module ID to global variable.
 *   E.g. `{ babylonjs: "BABYLON", "babylonjs-gui": "BABYLON.GUI" }`
 * @param {string} [options.outDir]            Production build output dir (default: "dist").
 */
export function commonDevViteConfiguration(options) {
    const { port, aliases = {}, staticDirs = ["public"], enableHttps = false, enableHmr = true, productionExternals = {}, outDir = "dist" } = options;

    // Resolve all alias values to absolute paths
    const resolvedAliases = Object.fromEntries(Object.entries(aliases).map(([key, value]) => [key, resolve(value)]));

    return {
        plugins: [react()],

        resolve: {
            alias: resolvedAliases,
            extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".scss", ".css"],
        },

        css: {
            // Vite handles SCSS, CSS modules, and plain CSS natively (requires `sass` package).
            // Use Vite's default hash-based scoped names — guaranteed valid and consistent.
            // A custom generateScopedName can break if Vite passes filenames with query
            // strings (e.g. ?used&lang.module.scss), producing invalid CSS selectors.
        },

        server: {
            port,
            https: enableHttps || false,
            hmr: enableHmr,
            // Allow the dev server to be reached from network (mirrors allowedHosts: all)
            host: "::",
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            fs: {
                // Allow serving files from outside the project root (needed for monorepo aliases)
                allow: ["../.."],
            },
        },

        // Tell Vite where to find static assets (mirrors webpack devServer.static)
        publicDir: staticDirs[0] ?? "public",

        build: {
            outDir,
            sourcemap: true,
            rollupOptions: {
                external: Object.keys(productionExternals),
                output: {
                    globals: productionExternals,
                },
            },
        },

        // Tell Vite to pre-bundle only the deps it needs, not the whole monorepo
        optimizeDeps: {
            // Exclude local workspace packages from pre-bundling (they are aliased to src/dist)
            exclude: Object.keys(aliases),
        },
    };
}
