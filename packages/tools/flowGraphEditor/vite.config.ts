import { defineConfig } from "vite";
import path from "path";
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

export default defineConfig(
    commonDevViteConfiguration({
        port: parseInt(process.env.FGE_PORT ?? "1347"),
        aliases: {
            "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
            core: path.resolve("../../dev/core/dist"),
            loaders: path.resolve("../../dev/loaders/dist"),
        },
        productionExternals: {
            babylonjs: "BABYLON",
            "babylonjs-loaders": "BABYLON",
        },
    })
);
