import { defineConfig } from "vite";
import path from "path";
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

export default defineConfig(
    commonDevViteConfiguration({
        port: parseInt(process.env.NME_PORT ?? "1340"),
        aliases: {
            "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
            core: path.resolve("../../dev/core/dist"),
        },
        productionExternals: {
            babylonjs: "BABYLON",
        },
    })
);
