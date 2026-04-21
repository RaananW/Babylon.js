import { defineConfig } from "vite";
import path from "path";
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

export default defineConfig(
    commonDevViteConfiguration({
        port: parseInt(process.env.NRGE_PORT ?? "1344"),
        aliases: {
            "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
            "core": path.resolve("../../dev/core/dist"),
            "gui": path.resolve("../../dev/gui/dist"),
            "loaders": path.resolve("../../dev/loaders/dist"),
        },
        productionExternals: {
            "babylonjs": "BABYLON",
            "babylonjs-gui": "BABYLON.GUI",
            "babylonjs-loaders": "BABYLON",
        },
    })
);
