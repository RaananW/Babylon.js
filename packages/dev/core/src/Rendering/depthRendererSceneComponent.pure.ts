/** This file must only contain pure code and pure imports */

export * from "./depthRendererSceneComponent.types";

import { Scene } from "../scene.pure";
import { type SmartArrayNoDuplicate } from "../Misc/smartArray"
import { type ISceneComponent } from "../sceneComponent"
import { SceneComponentConstants } from "../sceneComponent";
import { type RenderTargetTexture } from "../Materials/Textures/renderTargetTexture"
import { type Nullable } from "../types"
import { type Camera } from "../Cameras/camera"
import { DepthRenderer } from "./depthRenderer";
import { Constants } from "../Engines/constants";

/**
 * Defines the Depth Renderer scene component responsible to manage a depth buffer useful
 * in several rendering techniques.
 */
export class DepthRendererSceneComponent implements ISceneComponent {
    /**
     * The component name helpful to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_DEPTHRENDERER;

    /**
     * The scene the component belongs to.
     */
    public scene: Scene;

    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene: Scene) {
        this.scene = scene;
    }

    /**
     * Registers the component in a given scene
     */
    public register(): void {
        this.scene._gatherRenderTargetsStage.registerStep(SceneComponentConstants.STEP_GATHERRENDERTARGETS_DEPTHRENDERER, this, this._gatherRenderTargets);
        this.scene._gatherActiveCameraRenderTargetsStage.registerStep(
            SceneComponentConstants.STEP_GATHERACTIVECAMERARENDERTARGETS_DEPTHRENDERER,
            this,
            this._gatherActiveCameraRenderTargets
        );
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        // Nothing to do for this component
    }

    /**
     * Disposes the component and the associated resources
     */
    public dispose(): void {
        for (const key in this.scene._depthRenderer) {
            this.scene._depthRenderer[key].dispose();
        }
    }

    private _gatherRenderTargets(renderTargets: SmartArrayNoDuplicate<RenderTargetTexture>): void {
        if (this.scene._depthRenderer) {
            for (const key in this.scene._depthRenderer) {
                const depthRenderer = this.scene._depthRenderer[key];
                if (depthRenderer.enabled && !depthRenderer.useOnlyInActiveCamera) {
                    renderTargets.push(depthRenderer.getDepthMap());
                }
            }
        }
    }

    private _gatherActiveCameraRenderTargets(renderTargets: SmartArrayNoDuplicate<RenderTargetTexture>): void {
        if (this.scene._depthRenderer) {
            for (const key in this.scene._depthRenderer) {
                const depthRenderer = this.scene._depthRenderer[key];
                if (depthRenderer.enabled && depthRenderer.useOnlyInActiveCamera && this.scene.activeCamera!.id === key) {
                    renderTargets.push(depthRenderer.getDepthMap());
                }
            }
        }
    }
}

let _registered = false;

/**
 * Register side effects for depthRendererSceneComponent.
 * Safe to call multiple times; only the first call has an effect.
 */
export function registerDepthRendererSceneComponent(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    Scene.prototype.enableDepthRenderer = function (
        camera?: Nullable<Camera>,
        storeNonLinearDepth = false,
        force32bitsFloat: boolean = false,
        samplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        storeCameraSpaceZ: boolean = false,
        existingRenderTargetTexture?: RenderTargetTexture
    ): DepthRenderer {
        camera = camera || this.activeCamera;
        if (!camera) {
            throw "No camera available to enable depth renderer";
        }
        if (!this._depthRenderer) {
            this._depthRenderer = {};
        }
        if (!this._depthRenderer[camera.id]) {
            const supportFullfloat = !!this.getEngine().getCaps().textureFloatRender;
            let textureType: number;
            if (this.getEngine().getCaps().textureHalfFloatRender && (!force32bitsFloat || !supportFullfloat)) {
                textureType = Constants.TEXTURETYPE_HALF_FLOAT;
            } else if (supportFullfloat) {
                textureType = Constants.TEXTURETYPE_FLOAT;
            } else {
                textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
            }
            this._depthRenderer[camera.id] = new DepthRenderer(
                this,
                textureType,
                camera,
                storeNonLinearDepth,
                samplingMode,
                storeCameraSpaceZ,
                undefined,
                existingRenderTargetTexture
            );
        }

        return this._depthRenderer[camera.id];
    };

    Scene.prototype.disableDepthRenderer = function (camera?: Nullable<Camera>): void {
        camera = camera || this.activeCamera;
        if (!camera || !this._depthRenderer || !this._depthRenderer[camera.id]) {
            return;
        }

        this._depthRenderer[camera.id].dispose();
    };

    DepthRenderer._SceneComponentInitialization = (scene: Scene) => {
        // Register the G Buffer component to the scene.
        let component = scene._getComponent(SceneComponentConstants.NAME_DEPTHRENDERER) as DepthRendererSceneComponent;
        if (!component) {
            component = new DepthRendererSceneComponent(scene);
            scene._addComponent(component);
        }
    };
}
