/** This file must only contain pure code and pure imports */

import { Scene } from "../scene.pure";
import type { ISceneComponent } from "../sceneComponent";
import { SceneComponentConstants } from "../sceneComponent";
import type { SmartArrayNoDuplicate } from "../Misc/smartArray";
import type { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";

/**
 * Defines the Geometry Buffer scene component responsible to manage a G-Buffer useful
 * in several rendering techniques.
 */
export class GeometryBufferRendererSceneComponent implements ISceneComponent {
    /**
     * The component name helpful to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_GEOMETRYBUFFERRENDERER;

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
        this.scene._gatherRenderTargetsStage.registerStep(SceneComponentConstants.STEP_GATHERRENDERTARGETS_GEOMETRYBUFFERRENDERER, this, this._gatherRenderTargets);
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
        // Nothing to do for this component
    }

    private _gatherRenderTargets(renderTargets: SmartArrayNoDuplicate<RenderTargetTexture>): void {
        if (this.scene._geometryBufferRenderer) {
            renderTargets.push(this.scene._geometryBufferRenderer.getGBuffer());
        }
    }
}
