/**
 * Vite dev server entry point for the Node Particle Editor.
 *
 * For production CDN deployments use: npm run build:deployment -w @tools/node-particle-editor
 */
import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { NodeParticleSystemSet } from "core/Particles/Node/nodeParticleSystemSet";
// Register GLTF/GLB loader — mesh shape property tab lets users load .glb files.
import "loaders/glTF/2.0/glTFLoader";
import { NodeParticleEditor } from "./nodeParticleEditor";

void (async () => {
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
})();
