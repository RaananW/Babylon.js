/**
 * Browser-side options used to load a playground scene in memlab.
 */
export interface PlaygroundSceneBrowserOptions {
    /** Babylon server base URL. */
    baseUrl: string;
    /** Playground snippet API URL. */
    snippetUrl: string;
    /** Playground asset root URL. */
    pgRoot: string;
    /** Playground id to load. */
    playgroundId: string;
    /** Number of frames to render after the scene is ready. */
    renderCount?: number;
    /** Whether to open and close the inspector as part of the interaction. */
    toggleInspector?: boolean;
    /** Whether to simulate a small camera interaction. */
    simulateCameraMove?: boolean;
    /** Whether to briefly exercise animation groups during the action. */
    exerciseAnimationGroups?: boolean;
    /** Target engine name. */
    engineName?: "webgl2" | "webgl1";
    /** Time to wait after the scene becomes ready. */
    settleAfterReadyMs?: number;
    /** Time to wait after disposal completes. */
    settleAfterDisposeMs?: number;
}

/**
 * Browser-side options used to mount a viewer scenario in memlab.
 */
export interface ViewerSceneBrowserOptions {
    /** Viewer HTML that should be attached to the DOM. */
    viewerHtml: string;
    /** Minimum rendered frame count before the action is considered stable. */
    minFrameCount?: number;
    /** Time to wait after the viewer becomes idle. */
    settleAfterReadyMs?: number;
    /** Time to wait after unmounting the viewer. */
    settleAfterDisposeMs?: number;
}

/**
 * Browser-side options used to run package-focused scenarios on top of empty.html.
 */
export interface PackageSceneBrowserOptions {
    /** Babylon server base URL. */
    baseUrl: string;
    /** Shared Babylon assets base URL. */
    assetsUrl: string;
    /** Package scenario identifier. */
    scenario:
        | "gui-fullscreen-ui"
        | "gui-mesh-adt"
        | "loaders-boombox-import"
        | "loaders-obj-direct-load"
        | "loaders-stl-direct-load"
        | "serializers-gltf-export"
        | "serializers-glb-export";
    /** Number of frames to render after the scenario completes its main action. */
    renderCount?: number;
    /** Time to wait after the scenario becomes ready. */
    settleAfterReadyMs?: number;
}

/**
 * Initializes the Babylon page state and loads a playground into a fresh engine.
 * This function is evaluated in the browser context by Puppeteer.
 * @param options Playground load options.
 */
export async function evaluateInitializePlaygroundScene(options: PlaygroundSceneBrowserOptions): Promise<void> {
    const globalWindow = window as typeof window & {
        __babylonLeakHarnessState?: { busy: boolean; status: string; lastError?: string };
        BABYLON?: any;
        engine?: any;
        scene?: any;
        canvas?: HTMLCanvasElement;
        seed?: number;
        __babylonOriginalMathRandom?: () => number;
    };

    const setHarnessState = (status: string, busy: boolean, lastError?: string) => {
        globalWindow.__babylonLeakHarnessState = { busy, status, lastError };
    };
    const waitForAnimationFrames = async (count = 2) => {
        for (let index = 0; index < count; index++) {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }
    };
    const waitForSettle = async (delayMs = 0, frameCount = 2) => {
        await waitForAnimationFrames(frameCount);
        await Promise.resolve();

        if (delayMs > 0) {
            await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
            await Promise.resolve();
        }
    };

    setHarnessState("loading", true);

    try {
        globalWindow.__babylonOriginalMathRandom ??= globalWindow.Math.random;
        globalWindow.seed = 1;
        globalWindow.Math.random = function () {
            const currentSeed = globalWindow.seed ?? 1;
            globalWindow.seed = currentSeed + 1;
            const x = Math.sin(currentSeed) * 10000;
            return x - Math.floor(x);
        };

        const BABYLON = globalWindow.BABYLON;
        if (!BABYLON) {
            throw new Error("BABYLON is not available on the test page.");
        }

        if (globalWindow.scene?.debugLayer?.isVisible()) {
            await globalWindow.scene.debugLayer.hide();
        }
        if (globalWindow.scene) {
            globalWindow.scene.dispose();
            globalWindow.scene = null;
        }
        if (globalWindow.engine) {
            globalWindow.engine.stopRenderLoop?.();
            globalWindow.engine.dispose();
            globalWindow.engine = null;
        }

        const canvas = document.getElementById("babylon-canvas") as HTMLCanvasElement | null;
        if (!canvas) {
            throw new Error("The memory leak page does not expose #babylon-canvas.");
        }

        globalWindow.canvas = canvas;
        BABYLON.Tools.ScriptBaseUrl = options.baseUrl;
        BABYLON.SceneLoader.ShowLoadingScreen = false;
        BABYLON.SceneLoader.ForceFullSceneLoadingForIncremental = true;

        const engine = new BABYLON.Engine(canvas, false, {
            disableWebGL2Support: options.engineName === "webgl1",
            useHighPrecisionFloats: true,
        });
        engine.enableOfflineSupport = false;
        engine.renderEvenInBackground = true;
        engine.getCaps().parallelShaderCompile = undefined;
        globalWindow.engine = engine;

        const normalizedPlaygroundId = options.playgroundId[0] !== "#" || options.playgroundId.indexOf("#", 1) === -1 ? `${options.playgroundId}#0` : options.playgroundId;
        const data = await fetch(options.snippetUrl + normalizedPlaygroundId.replace(/#/g, "/"));
        const snippet = await data.json();
        const payload = JSON.parse(snippet.jsonPayload);

        let code: string;
        if (Object.prototype.hasOwnProperty.call(payload, "version")) {
            const v2Manifest = JSON.parse(payload.code);
            code = v2Manifest.files[v2Manifest.entry];
            code = code
                .replace(/export default \w+/g, "")
                .replace(/export const /g, "const ")
                .replace(/export var /g, "var ");
        } else {
            code = payload.code.toString();
        }

        code = code
            .replace(/"\/textures\//g, `"${options.pgRoot}/textures/`)
            .replace(/"textures\//g, `"${options.pgRoot}/textures/`)
            .replace(/\/scenes\//g, `${options.pgRoot}/scenes/`)
            .replace(/"scenes\//g, `"${options.pgRoot}/scenes/`)
            .replace(/"\.\.\/\.\.https/g, '"https')
            .replace("http://", "https://");

        const createSceneResult = eval(code + "\ncreateScene(engine)");
        const scene = createSceneResult?.then ? await createSceneResult : createSceneResult;
        globalWindow.scene = scene;

        if (!scene) {
            throw new Error(`The playground ${options.playgroundId} did not produce a scene.`);
        }

        await scene.whenReadyAsync();
        await waitForSettle(0, 2);

        const renderCount = options.renderCount ?? 6;
        for (let index = 0; index < renderCount; index++) {
            scene.render();
        }

        if (options.exerciseAnimationGroups && scene.animationGroups?.length) {
            scene.animationGroups.forEach((animationGroup: any) => {
                if (!animationGroup.isPlaying) {
                    animationGroup.start?.(true);
                }
            });

            for (let index = 0; index < Math.max(renderCount, 12); index++) {
                scene.render();
            }

            scene.animationGroups.forEach((animationGroup: any) => {
                animationGroup.stop?.();
                animationGroup.reset?.();
            });
            scene.stopAllAnimations?.();
            scene.render();
        }

        if (options.simulateCameraMove && scene.activeCamera) {
            const activeCamera = scene.activeCamera as any;
            if (typeof activeCamera.alpha === "number") {
                activeCamera.alpha += 0.15;
            }
            if (typeof activeCamera.beta === "number") {
                activeCamera.beta += 0.05;
            }
            if (activeCamera.position && typeof activeCamera.position.z === "number") {
                activeCamera.position.z += 0.25;
            }
            scene.render();
        }

        if (options.toggleInspector && scene.debugLayer) {
            await scene.debugLayer.show();
            scene.render();
            await scene.debugLayer.hide();
            scene.render();
        }

        await waitForSettle(options.settleAfterReadyMs ?? 150, 2);

        setHarnessState("ready", false);
    } catch (error) {
        const message = error instanceof Error ? error.message : `${error}`;
        setHarnessState("error", false, message);
        throw error;
    }
}

/**
 * Initializes a package-focused Babylon scenario on top of the empty Babylon Server host page.
 * This function is evaluated in the browser context by Puppeteer.
 * @param options Package scenario options.
 */
export async function evaluateInitializePackageScene(options: PackageSceneBrowserOptions): Promise<void> {
    const globalWindow = window as typeof window & {
        __babylonLeakHarnessState?: { busy: boolean; status: string; lastError?: string };
        BABYLON?: any;
        engine?: any;
        scene?: any;
        canvas?: HTMLCanvasElement;
    };

    const setHarnessState = (status: string, busy: boolean, lastError?: string) => {
        globalWindow.__babylonLeakHarnessState = { busy, status, lastError };
    };
    const waitForAnimationFrames = async (count = 2) => {
        for (let index = 0; index < count; index++) {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }
    };
    const waitForSettle = async (delayMs = 0, frameCount = 2) => {
        await waitForAnimationFrames(frameCount);
        await Promise.resolve();

        if (delayMs > 0) {
            await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
            await Promise.resolve();
        }
    };

    setHarnessState("loading", true);

    try {
        const BABYLON = globalWindow.BABYLON;
        if (!BABYLON) {
            throw new Error("BABYLON is not available on the test page.");
        }

        if (globalWindow.scene?.debugLayer?.isVisible()) {
            await globalWindow.scene.debugLayer.hide();
        }
        if (globalWindow.scene) {
            globalWindow.scene.dispose();
            globalWindow.scene = null;
        }
        if (globalWindow.engine) {
            globalWindow.engine.stopRenderLoop?.();
            globalWindow.engine.dispose();
            globalWindow.engine = null;
        }

        const canvas = document.getElementById("babylon-canvas") as HTMLCanvasElement | null;
        if (!canvas) {
            throw new Error("The memory leak page does not expose #babylon-canvas.");
        }

        globalWindow.canvas = canvas;
        BABYLON.Tools.ScriptBaseUrl = options.baseUrl;
        BABYLON.SceneLoader.ShowLoadingScreen = false;
        BABYLON.SceneLoader.ForceFullSceneLoadingForIncremental = true;

        const engine = new BABYLON.Engine(canvas, false, {
            useHighPrecisionFloats: true,
        });
        engine.enableOfflineSupport = false;
        engine.renderEvenInBackground = true;
        engine.getCaps().parallelShaderCompile = undefined;
        globalWindow.engine = engine;

        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.04, 0.05, 0.08, 1);
        globalWindow.scene = scene;

        const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 3, 8, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvas, false);
        scene.activeCamera = camera;

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 1.2;

        const createBaseContent = () => {
            const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 8, height: 8 }, scene);
            ground.position.y = -1;
            const material = new BABYLON.StandardMaterial("ground-material", scene);
            material.diffuseColor = new BABYLON.Color3(0.18, 0.19, 0.23);
            ground.material = material;
            return ground;
        };

        createBaseContent();

        if (options.scenario === "gui-fullscreen-ui") {
            const sphere = BABYLON.MeshBuilder.CreateSphere("gui-sphere", { diameter: 1.4, segments: 32 }, scene);
            sphere.position.y = 0.2;

            const adt = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("memlab-ui", true, scene);
            const panel = new BABYLON.GUI.StackPanel("panel");
            panel.width = "280px";
            panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            adt.addControl(panel);

            const header = new BABYLON.GUI.TextBlock("header", "Memory Leak GUI Scenario");
            header.height = "40px";
            header.color = "white";
            header.fontSize = 22;
            panel.addControl(header);

            const slider = new BABYLON.GUI.Slider("slider");
            slider.minimum = 0;
            slider.maximum = 1;
            slider.value = 0.35;
            slider.height = "20px";
            slider.width = "220px";
            slider.onValueChangedObservable.add((value: number) => {
                sphere.scaling.setAll(1 + value * 0.5);
            });
            panel.addControl(slider);

            const button = BABYLON.GUI.Button.CreateSimpleButton("button", "Toggle Color");
            button.width = "220px";
            button.height = "44px";
            button.color = "white";
            button.background = "#5067ff";
            button.onPointerClickObservable.add(() => {
                sphere.material ??= new BABYLON.StandardMaterial("gui-sphere-material", scene);
                sphere.material.diffuseColor = sphere.material.diffuseColor?.equals?.(BABYLON.Color3.Red()) ? BABYLON.Color3.Blue() : BABYLON.Color3.Red();
            });
            panel.addControl(button);

            slider.value = 0.75;
            button.onPointerClickObservable.notifyObservers(button);
            scene.render();
        } else if (options.scenario === "gui-mesh-adt") {
            const panelMesh = BABYLON.MeshBuilder.CreatePlane("gui-panel-mesh", { width: 2.4, height: 1.2 }, scene);
            panelMesh.position = new BABYLON.Vector3(0, 0.75, 0);

            const badgeMesh = BABYLON.MeshBuilder.CreatePlane("gui-badge-mesh", { width: 1.1, height: 1.1 }, scene);
            badgeMesh.position = new BABYLON.Vector3(-1.9, 0.55, 0.35);

            const panelTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(panelMesh, 1024, 512);
            const badgeTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(badgeMesh, 512, 512);

            const rectangle = new BABYLON.GUI.Rectangle("mesh-rectangle");
            rectangle.thickness = 3;
            rectangle.cornerRadius = 30;
            rectangle.color = "#d8e3ff";
            rectangle.background = "#1d2840";
            panelTexture.addControl(rectangle);

            const stack = new BABYLON.GUI.StackPanel("mesh-stack");
            stack.spacing = 16;
            stack.width = "80%";
            rectangle.addControl(stack);

            const title = new BABYLON.GUI.TextBlock("mesh-title", "Projected GUI");
            title.height = "70px";
            title.fontSize = 34;
            title.color = "white";
            stack.addControl(title);

            const toggle = BABYLON.GUI.Button.CreateSimpleButton("mesh-button", "Emphasize");
            toggle.width = "260px";
            toggle.height = "56px";
            toggle.color = "white";
            toggle.background = "#3ea66b";
            toggle.onPointerClickObservable.add(() => {
                rectangle.background = rectangle.background === "#1d2840" ? "#3c1f4f" : "#1d2840";
                panelMesh.scaling.x = panelMesh.scaling.x === 1 ? 1.08 : 1;
            });
            stack.addControl(toggle);

            const badge = new BABYLON.GUI.Ellipse("mesh-badge");
            badge.thickness = 10;
            badge.color = "#f6f3ff";
            badge.background = "#5067ff";
            badgeTexture.addControl(badge);

            const badgeText = new BABYLON.GUI.TextBlock("mesh-badge-text", "GUI");
            badgeText.color = "white";
            badgeText.fontSize = 130;
            badge.addControl(badgeText);

            toggle.onPointerClickObservable.notifyObservers(toggle);
            scene.render();
        } else if (options.scenario === "loaders-boombox-import") {
            const result = await BABYLON.SceneLoader.ImportMeshAsync("", `${options.assetsUrl}/meshes/`, "boombox.glb", scene);
            if (!result.meshes.length) {
                throw new Error("The loaders scenario did not load any meshes.");
            }
            result.meshes.forEach((mesh: any, index: number) => {
                if (mesh.position && typeof mesh.position.y === "number") {
                    mesh.position.y += index === 0 ? 0.5 : 0;
                }
            });
            result.animationGroups?.forEach?.((animationGroup: any) => animationGroup.start?.(true));
            scene.render();
            result.animationGroups?.forEach?.((animationGroup: any) => {
                animationGroup.stop?.();
                animationGroup.reset?.();
            });
        } else if (options.scenario === "loaders-obj-direct-load") {
            const objData = [
                "o quad",
                "v -1 -1 0",
                "v 1 -1 0",
                "v 1 1 0",
                "v -1 1 0",
                "vt 0 0",
                "vt 1 0",
                "vt 1 1",
                "vt 0 1",
                "vn 0 0 1",
                "f 1/1/1 2/2/1 3/3/1",
                "f 1/1/1 3/3/1 4/4/1",
            ].join("\n");
            const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", `data:model/obj;base64,${btoa(objData)}`, scene, undefined, ".obj");
            if (result.meshes.length !== 1 || result.meshes[0].getTotalVertices() !== 4) {
                throw new Error("The loaders OBJ scenario did not produce the expected mesh topology.");
            }
            result.meshes[0].rotation.y = Math.PI / 6;
            scene.render();
        } else if (options.scenario === "loaders-stl-direct-load") {
            const stlData = ["solid triangle", "facet normal 0 0 1", "outer loop", "vertex 0 0 0", "vertex 1 0 0", "vertex 0 1 0", "endloop", "endfacet", "endsolid triangle"].join(
                "\n"
            );
            const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", `data:;base64,${btoa(stlData)}`, scene, undefined, ".stl");
            if (result.meshes.length !== 1 || result.meshes[0].getTotalVertices() !== 3) {
                throw new Error("The loaders STL scenario did not produce the expected mesh topology.");
            }
            result.meshes[0].position.x = 0.5;
            scene.render();
        } else if (options.scenario === "serializers-gltf-export") {
            const box = BABYLON.MeshBuilder.CreateBox("serializers-box", { size: 1.2 }, scene);
            box.position.x = -1.1;
            const sphere = BABYLON.MeshBuilder.CreateSphere("serializers-sphere", { diameter: 1.1 }, scene);
            sphere.position.x = 1.1;

            const material = new BABYLON.PBRMaterial("serializers-material", scene);
            material.metallic = 0.2;
            material.roughness = 0.35;
            material.albedoColor = new BABYLON.Color3(0.9, 0.6, 0.2);
            box.material = material;
            sphere.material = material;

            const exportData = await BABYLON.GLTF2Export.GLTFAsync(scene, "memlab-scene");
            const exportedFiles = Object.keys(exportData.files ?? exportData.glTFFiles ?? {});
            if (exportedFiles.length === 0) {
                throw new Error("The serializers scenario did not produce any exported files.");
            }
            if (!exportedFiles.some((fileName) => fileName.endsWith(".gltf"))) {
                throw new Error("The serializers scenario did not produce a glTF file.");
            }
        } else {
            const torus = BABYLON.MeshBuilder.CreateTorus("serializers-torus", { diameter: 1.5, thickness: 0.35, tessellation: 48 }, scene);
            torus.rotation.x = Math.PI / 3;
            const knot = BABYLON.MeshBuilder.CreateTorusKnot("serializers-knot", { radius: 0.55, tube: 0.18, radialSegments: 96, tubularSegments: 48 }, scene);
            knot.position.set(1.4, 0.2, 0);

            const material = new BABYLON.StandardMaterial("serializers-glb-material", scene);
            material.diffuseColor = new BABYLON.Color3(0.18, 0.66, 0.86);
            torus.material = material;
            knot.material = material;

            const exportData = await BABYLON.GLTF2Export.GLBAsync(scene, "memlab-scene");
            const exportedFiles = Object.keys(exportData.files ?? exportData.glTFFiles ?? {});
            if (exportedFiles.length === 0) {
                throw new Error("The serializers GLB scenario did not produce any exported files.");
            }
            if (!exportedFiles.some((fileName) => fileName.endsWith(".glb"))) {
                throw new Error("The serializers GLB scenario did not produce a GLB file.");
            }
        }

        await scene.whenReadyAsync();

        const renderCount = options.renderCount ?? 8;
        for (let index = 0; index < renderCount; index++) {
            scene.render();
        }

        await waitForSettle(options.settleAfterReadyMs ?? 150, 2);

        setHarnessState("ready", false);
    } catch (error) {
        const message = error instanceof Error ? error.message : `${error}`;
        setHarnessState("error", false, message);
        throw error;
    }
}

/**
 * Disposes the active Babylon scene and engine from the memlab page.
 * This function is evaluated in the browser context by Puppeteer.
 */
export async function evaluateDisposePlaygroundScene(options: Pick<PlaygroundSceneBrowserOptions, "settleAfterDisposeMs"> = {}): Promise<void> {
    const globalWindow = window as typeof window & {
        __babylonLeakHarnessState?: { busy: boolean; status: string; lastError?: string };
        BABYLON?: any;
        engine?: any;
        scene?: any;
        canvas?: HTMLCanvasElement;
        __babylonOriginalMathRandom?: () => number;
    };
    const waitForAnimationFrames = async (count = 2) => {
        for (let index = 0; index < count; index++) {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }
    };
    const waitForSettle = async (delayMs = 0, frameCount = 2) => {
        await waitForAnimationFrames(frameCount);
        await Promise.resolve();

        if (delayMs > 0) {
            await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
            await Promise.resolve();
        }
    };
    const forceGarbageCollection = () => {
        if ((window as any).gc) {
            for (let index = 0; index < 3; index++) {
                (window as any).gc();
            }
        }
    };

    globalWindow.__babylonLeakHarnessState = { busy: true, status: "disposing" };

    try {
        if (globalWindow.scene?.debugLayer?.isVisible()) {
            await globalWindow.scene.debugLayer.hide();
        }

        globalWindow.scene?.activeCamera?.detachControl?.();
        globalWindow.scene?.activeCameras?.forEach?.((camera: any) => camera.detachControl?.());
        globalWindow.scene?.stopAllAnimations?.();
        globalWindow.scene?.animationGroups?.forEach?.((animationGroup: any) => animationGroup.stop?.());

        globalWindow.scene?.dispose?.();
        globalWindow.scene = null;

        globalWindow.engine?.stopRenderLoop?.();
        globalWindow.engine?.dispose?.();
        globalWindow.engine = null;
        (globalWindow as any).canvas = undefined;

        const floatingOriginCurrentScene = globalWindow.BABYLON?.FloatingOriginCurrentScene;
        if (floatingOriginCurrentScene) {
            floatingOriginCurrentScene.getScene = () => undefined;
            floatingOriginCurrentScene.eyeAtCamera = true;
        }

        if (globalWindow.__babylonOriginalMathRandom) {
            globalWindow.Math.random = globalWindow.__babylonOriginalMathRandom;
        }
        delete (globalWindow as any).seed;

        await waitForSettle(options?.settleAfterDisposeMs ?? 150, 3);
        forceGarbageCollection();
        await waitForSettle(50, 2);

        if (globalWindow.scene || globalWindow.engine) {
            throw new Error("The memory leak harness still holds engine or scene references after disposal.");
        }

        globalWindow.__babylonLeakHarnessState = { busy: false, status: "disposed" };
    } catch (error) {
        const message = error instanceof Error ? error.message : `${error}`;
        globalWindow.__babylonLeakHarnessState = { busy: false, status: "error", lastError: message };
        throw error;
    }
}

/**
 * Mounts a Babylon viewer custom element for memlab analysis.
 * This function is evaluated in the browser context by Puppeteer.
 * @param options Viewer mount options.
 */
export async function evaluateMountViewerScenario(options: ViewerSceneBrowserOptions): Promise<void> {
    const globalWindow = window as typeof window & {
        __babylonLeakHarnessState?: { busy: boolean; status: string; lastError?: string; mountedElementSelector?: string };
    };

    const setHarnessState = (status: string, busy: boolean, lastError?: string) => {
        globalWindow.__babylonLeakHarnessState = {
            busy,
            status,
            lastError,
            mountedElementSelector: "babylon-viewer",
        };
    };
    const waitForAnimationFrames = async (count = 2) => {
        for (let index = 0; index < count; index++) {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }
    };
    const waitForSettle = async (delayMs = 0, frameCount = 2) => {
        await waitForAnimationFrames(frameCount);
        await Promise.resolve();

        if (delayMs > 0) {
            await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
            await Promise.resolve();
        }
    };

    setHarnessState("mounting", true);

    try {
        const existingContainer = document.getElementById("__babylonMemlabViewerRoot");
        existingContainer?.remove();

        const container = document.createElement("div");
        container.id = "__babylonMemlabViewerRoot";
        container.innerHTML = options.viewerHtml;
        document.body.appendChild(container);

        const waitForCondition = async (predicate: () => boolean, timeoutMs: number, errorMessage: string) => {
            const startTime = Date.now();
            while (!predicate()) {
                if (Date.now() - startTime >= timeoutMs) {
                    throw new Error(errorMessage);
                }
                await new Promise((resolve) => setTimeout(resolve, 50));
            }
        };

        await waitForCondition(() => !!document.querySelector("babylon-viewer"), 30000, "The viewer element was not attached to the page.");

        const viewerElement = document.querySelector("babylon-viewer") as any;

        await waitForCondition(() => !!viewerElement.viewerDetails && viewerElement.viewerDetails.viewer.loadingProgress === false, 60000, "The viewer did not finish loading.");

        const minFrameCount = options.minFrameCount ?? 20;
        await waitForCondition(
            () => {
                const details = viewerElement.viewerDetails;
                const engine = details?.scene?.getEngine?.();
                return !!engine && engine.frameId >= minFrameCount;
            },
            30000,
            `The viewer did not render ${minFrameCount} frames.`
        );

        await waitForSettle(options.settleAfterReadyMs ?? 150, 2);

        setHarnessState("ready", false);
    } catch (error) {
        const message = error instanceof Error ? error.message : `${error}`;
        setHarnessState("error", false, message);
        throw error;
    }
}

/**
 * Unmounts the Babylon viewer custom element after a memlab action.
 * This function is evaluated in the browser context by Puppeteer.
 */
export async function evaluateUnmountViewerScenario(options: Pick<ViewerSceneBrowserOptions, "settleAfterDisposeMs"> = {}): Promise<void> {
    const globalWindow = window as typeof window & {
        __babylonLeakHarnessState?: { busy: boolean; status: string; lastError?: string };
    };
    const waitForAnimationFrames = async (count = 2) => {
        for (let index = 0; index < count; index++) {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }
    };
    const waitForSettle = async (delayMs = 0, frameCount = 2) => {
        await waitForAnimationFrames(frameCount);
        await Promise.resolve();

        if (delayMs > 0) {
            await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
            await Promise.resolve();
        }
    };
    const forceGarbageCollection = () => {
        if ((window as any).gc) {
            for (let index = 0; index < 3; index++) {
                (window as any).gc();
            }
        }
    };

    globalWindow.__babylonLeakHarnessState = { busy: true, status: "disposing" };

    try {
        (document.querySelector("babylon-viewer") as HTMLElement | null)?.remove();
        document.getElementById("__babylonMemlabViewerRoot")?.remove();

        await waitForSettle(options?.settleAfterDisposeMs ?? 150, 2);
        forceGarbageCollection();
        await waitForSettle(50, 2);

        if (document.querySelector("babylon-viewer") || document.getElementById("__babylonMemlabViewerRoot")) {
            throw new Error("The viewer test app still has mounted elements after unmount.");
        }

        globalWindow.__babylonLeakHarnessState = { busy: false, status: "disposed" };
    } catch (error) {
        const message = error instanceof Error ? error.message : `${error}`;
        globalWindow.__babylonLeakHarnessState = { busy: false, status: "error", lastError: message };
        throw error;
    }
}
