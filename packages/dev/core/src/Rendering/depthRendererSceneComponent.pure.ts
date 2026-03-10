/** This file must only contain pure code and pure imports */

import type { Scene } from "../scene.pure";
import type { SmartArrayNoDuplicate } from "../Misc/smartArray";
import type { ISceneComponent } from "../sceneComponent";
import { SceneComponentConstants } from "../sceneComponent";
import type { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";

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
