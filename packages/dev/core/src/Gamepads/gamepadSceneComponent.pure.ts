/** This file must only contain pure code and pure imports */

import { Scene } from "../scene.pure";
import type { ISceneComponent } from "../sceneComponent";
import { SceneComponentConstants } from "../sceneComponent";

/**
 * Defines the gamepad scene component responsible to manage gamepads in a given scene
 */
export class GamepadSystemSceneComponent implements ISceneComponent {
    /**
     * The component name helpfull to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_GAMEPAD;

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
        // Nothing to do for gamepads
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        // Nothing to do for gamepads
    }

    /**
     * Disposes the component and the associated resources
     */
    public dispose(): void {
        const gamepadManager = this.scene._gamepadManager;
        if (gamepadManager) {
            gamepadManager.dispose();
            this.scene._gamepadManager = null;
        }
    }
}
