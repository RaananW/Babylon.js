import { defineConfig } from "vite";
import path from "path";
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

export default defineConfig(
    commonDevViteConfiguration({
        port: parseInt(process.env.NGE_PORT ?? "1343"),
        aliases: {
            "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
            core: path.resolve("../../dev/core/dist"),
            loaders: path.resolve("../../dev/loaders/dist"),
            materials: path.resolve("../../dev/materials/dist"),
            serializers: path.resolve("../../dev/serializers/dist"),
        },
        productionExternals: {
            babylonjs: "BABYLON",
            "babylonjs-loaders": "BABYLON",
            "babylonjs-materials": "BABYLON",
            "babylonjs-serializers": "BABYLON",
        },
    })
);
