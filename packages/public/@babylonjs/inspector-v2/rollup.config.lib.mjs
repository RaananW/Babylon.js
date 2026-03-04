import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";
import path from "path";

// Aliases to map dev package names to their public @babylonjs/ equivalents.
// Previously this was handled by ts-patch during TypeScript compilation;
// now we do it at the rollup level.
const devToPublicAliases = [
    { find: "core", replacement: "@babylonjs/core" },
    { find: "gui", replacement: "@babylonjs/gui" },
    { find: "loaders", replacement: "@babylonjs/loaders" },
    { find: "materials", replacement: "@babylonjs/materials" },
    { find: "addons", replacement: "@babylonjs/addons" },
    { find: "gui-editor", replacement: "@babylonjs/gui-editor" },
    { find: "serializers", replacement: "@babylonjs/serializers" },
    { find: "node-editor", replacement: "@babylonjs/node-editor" },
    { find: "node-geometry-editor", replacement: "@babylonjs/node-geometry-editor" },
    { find: "node-particle-editor", replacement: "@babylonjs/node-particle-editor" },
    { find: "node-render-graph-editor", replacement: "@babylonjs/node-render-graph-editor" },
];

// Append .js extension to @babylonjs/ subpath imports for ESM compatibility
const appendJsToExternalPaths = (id) => {
    if (/^@babylonjs\/[^/]+\/.+/.test(id) && !id.endsWith(".js")) {
        return id + ".js";
    }
    return id;
};

// Rewrite dev package names to their public @babylonjs/ equivalents and
// append .js extension to sub-path imports for ESM compatibility.
// Used as the output `paths` function for the dts config where dev package
// imports are marked external (to prevent rollup-plugin-dts from inlining
// the massive type graph) and need rewriting in the output.
const rewriteExternalPaths = (id) => {
    // Rewrite dev package names to public names
    for (const { find, replacement } of devToPublicAliases) {
        if (id === find || id.startsWith(find + "/")) {
            id = id.replace(find, replacement);
            break;
        }
    }
    return appendJsToExternalPaths(id);
};

// Set of dev package names used by the external check in the dts config.
const devPackageNames = new Set(devToPublicAliases.map((a) => a.find));

const commonConfig = {
    input: "../../../dev/inspector-v2/src/index.ts",
    external: (id) => {
        // Check for @babylonjs packages - these should be external
        if (/^@babylonjs\//.test(id)) {
            return true;
        }

        // Check for Fluent UI packages (including @fluentui-contrib)
        if (/^@fluentui(-contrib)?\//.test(id)) {
            return true;
        }

        // Check for React packages (including sub-paths like react/jsx-runtime)
        if (id === "react" || id === "react-dom" || id.startsWith("react/") || id.startsWith("react-dom/")) {
            return true;
        }

        // Check for other external packages
        if (id === "usehooks-ts") {
            return true;
        }

        return false;
    },
};

const jsConfig = {
    ...commonConfig,
    output: {
        dir: "lib",
        sourcemap: true,
        format: "es",
        exports: "named",
        paths: appendJsToExternalPaths,
    },
    plugins: [
        alias({
            entries: [
                // shared-ui-components is resolved to its source dir for bundling (not external)
                { find: "shared-ui-components", replacement: path.resolve("../../../dev/sharedUiComponents/src") },
                ...devToPublicAliases,
            ],
        }),
        typescript({ tsconfig: "tsconfig.build.lib.json" }),
        nodeResolve({ mainFields: ["browser", "module", "main"] }),
        commonjs(),
    ],
    onwarn(warning, warn) {
        // Treat all other warnings as errors.
        throw new Error(warning.message);
    },
};

// For the dts pass, use a separate tsconfig that strips dev package path
// mappings (core/*, gui/*, etc.). rollup-plugin-dts uses TypeScript internally
// to resolve the full type tree. With the dev paths, TypeScript resolves
// "core/*" to dev/core/dist/* declarations and inlines the entire type graph,
// causing OOM. The stripped tsconfig makes TypeScript unable to resolve these
// imports, so the dts plugin treats them as external. The output `paths`
// function then rewrites "core/..." to "@babylonjs/core/..." in the .d.ts.
//
// We use respectExternal: true + an array-based external config (not a function)
// so rollup-plugin-dts correctly skips type resolution for external modules.
const dtsExternals = [
    /^@babylonjs\//,
    /^@fluentui(-contrib)?\//,
    /^react(-dom)?(\/|$)/,
    /^usehooks-ts$/,
    // Dev package names must be external to prevent the dts plugin from
    // trying to inline their massive type graphs
    ...Array.from(devPackageNames).map((name) => new RegExp(`^${name}(\\/|$)`)),
];

const dtsConfig = {
    ...commonConfig,
    external: dtsExternals,
    output: {
        file: "lib/index.d.ts",
        format: "es",
        paths: rewriteExternalPaths,
    },
    plugins: [
        // No alias plugin needed: shared-ui-components resolves through the
        // tsconfig paths to dist/ declarations (much lighter than source).
        // On master, the dts plugin resolved shared-ui-components the same way
        // (via tsconfig paths to dist/). Using the alias plugin to point at src/
        // causes OOM because processing raw TypeScript source is far more
        // memory-intensive than pre-compiled .d.ts files.
        dts({ tsconfig: "tsconfig.build.dts.json", respectExternal: true }),
    ],
};

export default [jsConfig, dtsConfig];
