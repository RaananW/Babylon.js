import { createConfig } from "../rollup.config.mcp.mjs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Resolve bare `@dev/core/src/…` imports to the pre-compiled JS files in
 * core's dist/ folder so rollup can tree-shake them into the bundle without
 * needing an `exports` map in core's package.json.
 */
function resolveDevCore() {
    return {
        name: "resolve-dev-core",
        resolveId(source) {
            if (source.startsWith("@dev/core/")) {
                const subpath = source.slice("@dev/core/".length);
                return resolve(__dirname, "../../dev/core/dist", subpath + ".js");
            }
            return null;
        },
    };
}

const config = createConfig();
config.plugins = [resolveDevCore(), ...config.plugins];

export default config;
