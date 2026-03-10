/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import depthRendererSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./depthRendererSceneComponent.pure";

import { DepthRendererSceneComponent } from "./depthRendererSceneComponent.pure";
import { Nullable } from "../types";
import { Scene } from "../scene";
import { Camera } from "../Cameras/camera";
import { SceneComponentConstants } from "../sceneComponent";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { DepthRenderer } from "./depthRenderer";
import { Constants } from "../Engines/constants";

declare module "../scene" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal (Backing field) */
        _depthRenderer: { [id: string]: DepthRenderer };

        /**
         * Creates a depth renderer a given camera which contains a depth map which can be used for post processing.
         * @param camera The camera to create the depth renderer on (default: scene's active camera)
         * @param storeNonLinearDepth Defines whether the depth is stored linearly like in Babylon Shadows or directly like glFragCoord.z
         * @param force32bitsFloat Forces 32 bits float when supported (else 16 bits float is prioritized over 32 bits float if supported)
         * @param samplingMode The sampling mode to be used with the render target (Linear, Nearest...)
         * @param storeCameraSpaceZ Defines whether the depth stored is the Z coordinate in camera space. If true, storeNonLinearDepth has no effect. (Default: false)
         * @param existingRenderTargetTexture An existing render target texture to use (default: undefined). If not provided, a new render target texture will be created.
         * @returns the created depth renderer
         */
        enableDepthRenderer(
            camera?: Nullable<Camera>,
            storeNonLinearDepth?: boolean,
            force32bitsFloat?: boolean,
            samplingMode?: number,
            storeCameraSpaceZ?: boolean,
            existingRenderTargetTexture?: RenderTargetTexture
        ): DepthRenderer;

        /**
         * Disables a depth renderer for a given camera
         * @param camera The camera to disable the depth renderer on (default: scene's active camera)
         */
        disableDepthRenderer(camera?: Nullable<Camera>): void;
    }
}

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
        // eslint-disable-next-line no-throw-literal
        throw "No camera available to enable depth renderer";
    }
    if (!this._depthRenderer) {
        this._depthRenderer = {};
    }
    if (!this._depthRenderer[camera.id]) {
        const supportFullfloat = !!this.getEngine().getCaps().textureFloatRender;
        let textureType = 0;
        if (this.getEngine().getCaps().textureHalfFloatRender && (!force32bitsFloat || !supportFullfloat)) {
            textureType = Constants.TEXTURETYPE_HALF_FLOAT;
        } else if (supportFullfloat) {
            textureType = Constants.TEXTURETYPE_FLOAT;
        } else {
            textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        }
        this._depthRenderer[camera.id] = new DepthRenderer(this, textureType, camera, storeNonLinearDepth, samplingMode, storeCameraSpaceZ, undefined, existingRenderTargetTexture);
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
