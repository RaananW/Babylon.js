/**
 * Shared rollup configuration for all Babylon.js MCP servers.
 *
 * Each server imports this and calls `createConfig("./src/index.ts")`
 * to produce a single self-contained, minified ESM bundle at dist/index.js
 * with no external dependencies (only Node built-ins are external).
 */

import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { builtinModules } from "node:module";
import { transform } from "esbuild";

/** Strip shebang lines from source so the banner is the only one. */
function stripShebang() {
    return {
        name: "strip-shebang",
        transform(code, id) {
            if (code.startsWith("#!")) {
                return { code: code.replace(/^#![^\n]*\n/, ""), map: null };
            }
            return null;
        },
    };
}

/** Minify bundled chunks using esbuild (handles modern JS incl. private fields). */
function esbuildMinify() {
    return {
        name: "esbuild-minify",
        async renderChunk(code) {
            const result = await transform(code, {
                minify: true,
                target: "node18",
                format: "esm",
            });
            return { code: result.code, map: result.map || null };
        },
    };
}

/** Node built-in modules that must stay external (e.g. "fs", "node:fs"). */
const nodeBuiltins = [...builtinModules, ...builtinModules.map((m) => `node:${m}`)];

/**
 * Modules that should remain external even though they appear in
 * dependency code. The snippet-loader lazy-imports Monaco's TypeScript
 * services for playground transpilation — MCP servers never trigger that
 * code path (they only load data snippets), so we exclude it.
 */
const alwaysExternal = [...nodeBuiltins, /^monaco-editor/];

/**
 * @param {string} input  Entry point relative to the server package root.
 * @returns {import("rollup").RollupOptions}
 */
export function createConfig(input = "./src/index.ts") {
    return {
        input,
        output: {
            file: "dist/index.js",
            format: "es",
            sourcemap: true,
            // Preserve the shebang so `npx` / `bin` invocation still works.
            banner: "#!/usr/bin/env node",
        },
        external: alwaysExternal,
        plugins: [
            stripShebang(),
            typescript({
                tsconfig: "./tsconfig.json",
                // Declarations are not needed in the bundle.
                declaration: false,
                declarationMap: false,
            }),
            nodeResolve({ preferBuiltins: true }),
            commonjs(),
            json(),
            esbuildMinify(),
        ],
    };
}
