import { defineConfig } from "vite";
import path from "path";
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

export default defineConfig(
    commonDevViteConfiguration({
        port: parseInt(process.env.SANDBOX_PORT ?? "1339"),
        aliases: {
            "shared-ui-components": path.resolve("../../dev/sharedUiComponents/dist"),
            "core": path.resolve("../../dev/core/dist"),
            "gui": path.resolve("../../dev/gui/dist"),
            "loaders": path.resolve("../../dev/loaders/dist"),
            "serializers": path.resolve("../../dev/serializers/dist"),
            "materials": path.resolve("../../dev/materials/dist"),
            "addons": path.resolve("../../dev/addons/dist")
        },
        productionExternals: {
            "babylonjs": "BABYLON",
            "babylonjs-gui": "BABYLON.GUI",
            "babylonjs-loaders": "BABYLON",
            "babylonjs-serializers": "BABYLON",
            "babylonjs-materials": "BABYLON",
            "babylonjs-addons": "ADDONS"
        },
    })
);
