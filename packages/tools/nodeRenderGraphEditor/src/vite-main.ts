/**
 * Vite dev server entry point for the Node Render Graph Editor.
 *
 * TODO: NodeRenderGraph requires engine/frame graph setup. For now this opens
 * the editor with a minimal setup. Advanced snippet loading is not yet ported.
 *
 * For production CDN deployments use: npm run build:deployment -w @tools/node-render-graph-editor
 */
import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { NodeRenderGraph } from "core/FrameGraph/Node/nodeRenderGraph";
// Register GLTF/GLB loader — preview panel loads .glb meshes from assets.babylonjs.com.
import "loaders/glTF/index";
import { NodeRenderGraphEditor } from "./index";

async function main() {
    const hostElement = document.getElementById("host-element") as HTMLElement;

    const canvas = document.createElement("canvas");
    canvas.style.display = "none";
    document.body.appendChild(canvas);

    if (!Engine.isSupported()) {
        alert("Babylon.js is not supported in this browser.");
        return;
    }

    const engine = new Engine(canvas, false);
    const scene = new Scene(engine);

    // Create a minimal NodeRenderGraph for the editor to open with
    const nodeRenderGraph = new NodeRenderGraph("nodeRenderGraph", scene);
    nodeRenderGraph.setToDefault();
    await nodeRenderGraph.buildAsync();

    NodeRenderGraphEditor.Show({
        nodeRenderGraph,
        hostElement,
    });
}

main().catch(console.error);
