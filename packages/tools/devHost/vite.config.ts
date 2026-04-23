import { defineConfig, type Plugin } from "vite";
import path from "path";
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

/**
 * Stub optional peer dependencies that core/src references but that are not
 * installed in the dev workspace (e.g. draco3dgltf, ammo.js). Webpack handled
 * these via externalsFunction; Vite needs an explicit stub plugin.
 */
function stubOptionalPeerDepsPlugin(): Plugin {
    const optionals = new Set(["draco3dgltf", "ammo.js", "cannon", "oimo", "recast", "havok", "basis_transcoder"]);
    return {
        name: "stub-optional-peer-deps",
        resolveId(id) {
            if (optionals.has(id)) return `\0stub:${id}`;
        },
        load(id) {
            if (id.startsWith("\0stub:")) return "export default {};";
        },
    };
}

export default defineConfig((_env) => {
    const base = commonDevViteConfiguration({
        port: parseInt(process.env.TOOLS_PORT ?? "1338"),
        aliases: {
            core: path.resolve("../../dev/core/src"),
            gui: path.resolve("../../dev/gui/src"),
            serializers: path.resolve("../../dev/serializers/src"),
            loaders: path.resolve("../../dev/loaders/src"),
            materials: path.resolve("../../dev/materials/src"),
            "lottie-player": path.resolve("../../dev/lottiePlayer/src"),
            inspector: path.resolve("../../dev/inspector/src"),
            "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
            "post-processes": path.resolve("../../dev/postProcesses/src"),
            "procedural-textures": path.resolve("../../dev/proceduralTextures/src"),
            "node-editor": path.resolve("../../tools/nodeEditor/src"),
            "node-geometry-editor": path.resolve("../../tools/nodeGeometryEditor/src"),
            "node-render-graph-editor": path.resolve("../../tools/nodeRenderGraphEditor/src"),
            "node-particle-editor": path.resolve("../../tools/nodeParticleEditor/src"),
            "gui-editor": path.resolve("../../tools/guiEditor/src"),
            accessibility: path.resolve("../../tools/accessibility/src"),
            "babylonjs-gltf2interface": path.resolve("./src/babylon.glTF2Interface.ts"),
        },
    });

    return {
        ...base,
        plugins: [...(base.plugins ?? []), stubOptionalPeerDepsPlugin()],
    };
});
