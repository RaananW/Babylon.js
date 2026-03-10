/** This file must only contain pure code and pure imports */

import type { Nullable } from "../types";
import { Scene } from "../scene.pure";
import type { SmartArrayNoDuplicate } from "../Misc/smartArray";
import type { Camera } from "../Cameras/camera";
import type { ISceneComponent } from "../sceneComponent";
import { SceneComponentConstants } from "../sceneComponent";
import type { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import type { DepthRenderer } from "./depthRenderer";

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
