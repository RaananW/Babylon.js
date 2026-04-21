import { defineConfig } from "vite";
import path from "path";
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

export default defineConfig(
    commonDevViteConfiguration({
        port: parseInt(process.env.GUIEDITOR_PORT ?? "1341"),
        aliases: {
            "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
            core: path.resolve("../../dev/core/dist"),
            gui: path.resolve("../../dev/gui/dist"),
        },
        productionExternals: {
            babylonjs: "BABYLON",
            "babylonjs-gui": "BABYLON.GUI",
        },
    })
);
