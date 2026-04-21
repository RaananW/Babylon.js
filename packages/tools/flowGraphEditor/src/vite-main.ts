/**
 * Vite dev server entry point for the Flow Graph Editor.
 *
 * FlowGraph requires an active scene. This creates a minimal engine/scene/graph.
 * For production CDN deployments use: npm run build:deployment -w @tools/flow-graph-editor
 */
import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { FlowGraph } from "core/FlowGraph/flowGraph";
import { FlowGraphEditor } from "./index";

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
    const graph = new FlowGraph({ scene });

    FlowGraphEditor.Show({
        flowGraph: graph,
        hostScene: scene,
        hostElement,
    });
}

main().catch(console.error);
