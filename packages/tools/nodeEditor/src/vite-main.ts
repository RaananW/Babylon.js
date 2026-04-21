/**
 * Vite dev server entry point for the Node Material Editor.
 *
 * Ports the initialization logic from public/index.js into TypeScript,
 * importing babylon directly from the monorepo instead of loading from CDN.
 *
 * For production CDN deployments use:
 *   npm run build:deployment -w @tools/node-editor
 */
import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { Vector3 } from "core/Maths/math.vector";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { NodeMaterialModes } from "core/Materials/Node/Enums/nodeMaterialModes";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { NodeEditor } from "./index";

const snippetUrl = "https://snippet.babylonjs.com";

async function main() {
    const hostElement = document.getElementById("host-element") as HTMLElement;
    const hash = location.hash?.replace(/^#/, "");
    const urlParams = new URLSearchParams(location.search);
    const mode = parseInt(urlParams.get("mode") ?? "0") as NodeMaterialModes;

    // Create a hidden canvas for the Babylon engine
    const canvas = document.createElement("canvas");
    canvas.style.display = "none";
    document.body.appendChild(canvas);

    if (!Engine.isSupported()) {
        alert("Babylon.js is not supported in this browser.");
        return;
    }

    const engine = new Engine(canvas, false, { disableWebGL2Support: false });
    const scene = new Scene(engine);
    new HemisphericLight("light0", new Vector3(0, 1, 0), scene);
    new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
    new HemisphericLight("light2", new Vector3(0, 1, 0), scene);

    const nodeMaterial = new NodeMaterial("node", scene, { shaderLanguage: ShaderLanguage.GLSL });

    // Load from snippet or set default
    if (hash) {
        try {
            const response = await fetch(`${snippetUrl}/${hash.replace("#", "/")}`);
            const snippet = await response.json();
            const serialization = JSON.parse(snippet.nodeMaterial);
            await nodeMaterial.loadFromSerialization(serialization);
            nodeMaterial.build(true);
        } catch {
            nodeMaterial.setToDefault();
            nodeMaterial.build(true);
        }
    } else {
        switch (mode) {
            case NodeMaterialModes.PostProcess:
                nodeMaterial.setToDefaultPostProcess();
                break;
            case NodeMaterialModes.Particle:
                nodeMaterial.setToDefaultParticle();
                break;
            case NodeMaterialModes.ProceduralTexture:
                nodeMaterial.setToDefaultProceduralTexture();
                break;
            default:
                nodeMaterial.setToDefault();
        }
        nodeMaterial.build(true);
    }

    let currentSnippetToken = hash || undefined;

    NodeEditor.Show({
        nodeMaterial,
        hostElement,
        customSave: {
            label: "Save as unique URL",
            action: async (data: string) => {
                const body = { payload: JSON.stringify({ nodeMaterial: data }), name: "", description: "", tags: "" };
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
