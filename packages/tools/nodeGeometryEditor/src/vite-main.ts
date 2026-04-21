/**
 * Vite dev server entry point for the Node Geometry Editor.
 *
 * Ports the initialization logic from public/index.js into TypeScript.
 * For production CDN deployments use: npm run build:deployment -w @tools/node-geometry-editor
 */
import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { NodeGeometry } from "core/Meshes/Node/nodeGeometry";
// Register GLTF/GLB loader — mesh node property tab lets users load .glb files.
import "loaders/glTF/index";
import { NodeGeometryEditor } from "./index";

const snippetUrl = "https://snippet.babylonjs.com";

async function main() {
    const hostElement = document.getElementById("host-element") as HTMLElement;
    const hash = location.hash?.replace(/^#/, "");

    const canvas = document.createElement("canvas");
    canvas.style.display = "none";
    document.body.appendChild(canvas);

    if (!Engine.isSupported()) {
        alert("Babylon.js is not supported in this browser.");
        return;
    }

    const engine = new Engine(canvas, false);
    const scene = new Scene(engine);
    const nodeGeometry = new NodeGeometry("nodeGeometry");

    if (hash) {
        try {
            const response = await fetch(`${snippetUrl}/${hash.replace("#", "/")}`);
            const snippet = await response.json();
            const serialization = JSON.parse(snippet.nodeGeometry);
            nodeGeometry.parseSerializedObject(serialization);
            nodeGeometry.build();
        } catch {
            nodeGeometry.setToDefault();
            nodeGeometry.build();
        }
    } else {
        nodeGeometry.setToDefault();
        nodeGeometry.build();
    }

    let currentSnippetToken = hash || undefined;

    NodeGeometryEditor.Show({
        nodeGeometry,
        hostScene: scene,
        hostElement,
        customSave: {
            label: "Save as unique URL",
            action: async (data: string) => {
                const body = { payload: JSON.stringify({ nodeGeometry: data }), name: "", description: "", tags: "" };
                const response = await fetch(snippetUrl + (currentSnippetToken ? "/" + currentSnippetToken : ""), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                const result = await response.json();
                const newToken = result.id + (result.version && result.version !== "0" ? "#" + result.version : "");
                currentSnippetToken = newToken;
                location.hash = newToken;
            },
        },
    });
}

main().catch(console.error);
