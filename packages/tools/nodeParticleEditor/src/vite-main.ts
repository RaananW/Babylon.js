/**
 * Vite dev server entry point for the Node Particle Editor.
 *
 * For production CDN deployments use: npm run build:deployment -w @tools/node-particle-editor
 */
import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { NodeParticleSystemSet } from "core/Particles/Node/nodeParticleSystemSet";
import { NodeParticleEditor } from "./index";

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
    const nodeParticleSet = new NodeParticleSystemSet("nodeParticleSystemSet");
    nodeParticleSet.setToDefault();

    NodeParticleEditor.Show({
        nodeParticleSet,
        hostScene: scene,
        hostElement,
    });
}

main().catch(console.error);
