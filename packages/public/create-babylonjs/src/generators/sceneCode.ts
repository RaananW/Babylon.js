import type { ProjectOptions } from "../index";

const GLTF_MODEL_URL = "https://assets.babylonjs.com/meshes/boombox.glb";

// ES6 scene code — tree-shakeable imports
function es6Scene(language: "ts" | "js"): string {
    const canvasCast = language === "ts" ? " as HTMLCanvasElement" : "";
    return `import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

// Side-effect imports: these register plugins and augment prototypes at load time
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Helpers/sceneHelpers";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Materials/PBR/pbrMaterial";
import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";
import "@babylonjs/loaders/glTF";

const canvas = document.getElementById("renderCanvas")${canvasCast};
const engine = new Engine(canvas, true);

const createScene = async () => {
    const scene = new Scene(engine);

    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 1, new Vector3(0, 0.05, 0), scene);
    camera.attachControl(canvas, true);
    camera.minZ = 0.001;

    // Create a default environment (skybox + ground + environment lighting)
    scene.createDefaultEnvironment({
        createGround: true,
        createSkybox: true,
    });

    // Load a glTF model
    await SceneLoader.AppendAsync("${GLTF_MODEL_URL}", undefined, scene);

    return scene;
};

createScene().then((scene) => {
    engine.runRenderLoop(() => {
        scene.render();
    });
});

window.addEventListener("resize", () => {
    engine.resize();
});
`;
}

// UMD scene code — global BABYLON namespace
function umdScene(language: "ts" | "js"): string {
    if (language === "ts") {
        return `import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas, true);

const createScene = async (): Promise<BABYLON.Scene> => {
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 1, new BABYLON.Vector3(0, 0.05, 0), scene);
    camera.attachControl(canvas, true);
    camera.minZ = 0.001;

    // Create a default environment (skybox + ground + environment lighting)
    scene.createDefaultEnvironment({
        createGround: true,
        createSkybox: true,
    });

    // Load a glTF model
    await BABYLON.SceneLoader.AppendAsync("${GLTF_MODEL_URL}", undefined, scene);

    return scene;
};

createScene().then((scene) => {
    engine.runRenderLoop(() => {
        scene.render();
    });
});

window.addEventListener("resize", () => {
    engine.resize();
});
`;
    }

    // UMD + JS
    return `const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const createScene = async () => {
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 1, new BABYLON.Vector3(0, 0.05, 0), scene);
    camera.attachControl(canvas, true);
    camera.minZ = 0.001;

    // Create a default environment (skybox + ground + environment lighting)
    scene.createDefaultEnvironment({
        createGround: true,
        createSkybox: true,
    });

    // Load a glTF model
    await BABYLON.SceneLoader.AppendAsync("${GLTF_MODEL_URL}", undefined, scene);

    return scene;
};

createScene().then((scene) => {
    engine.runRenderLoop(() => {
        scene.render();
    });
});

window.addEventListener("resize", () => {
    engine.resize();
});
`;
}

export function generateSceneCode(options: ProjectOptions): string {
    const { moduleFormat, language } = options;
    if (moduleFormat === "es6") {
        return es6Scene(language);
    }
    return umdScene(language);
}
