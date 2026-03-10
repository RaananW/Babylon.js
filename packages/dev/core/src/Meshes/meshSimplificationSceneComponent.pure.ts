/** This file must only contain pure code and pure imports */

import { Scene } from "../scene.pure";
import type { ISceneComponent } from "../sceneComponent";
import { SceneComponentConstants } from "../sceneComponent";

/**
 * Defines the simplification queue scene component responsible to help scheduling the various simplification task
 * created in a scene
 */
export class SimplicationQueueSceneComponent implements ISceneComponent {
    /**
     * The component name helpfull to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_SIMPLIFICATIONQUEUE;

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
        this.scene._beforeCameraUpdateStage.registerStep(SceneComponentConstants.STEP_BEFORECAMERAUPDATE_SIMPLIFICATIONQUEUE, this, this._beforeCameraUpdate);
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

    private _beforeCameraUpdate(): void {
        if (this.scene._simplificationQueue && !this.scene._simplificationQueue.running) {
            this.scene._simplificationQueue.executeNext();
        }
    }
}
