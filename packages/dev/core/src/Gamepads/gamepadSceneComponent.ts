/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gamepadSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gamepadSceneComponent.pure";

import { Scene } from "../scene";
import { SceneComponentConstants } from "../sceneComponent";
import { GamepadManager } from "./gamepadManager";
import { FreeCameraInputsManager } from "../Cameras/freeCameraInputsManager";
import { FreeCameraGamepadInput } from "../Cameras/Inputs/freeCameraGamepadInput";
import { ArcRotateCameraInputsManager } from "../Cameras/arcRotateCameraInputsManager";
import { ArcRotateCameraGamepadInput } from "../Cameras/Inputs/arcRotateCameraGamepadInput";


Object.defineProperty(Scene.prototype, "gamepadManager", {
    get: function (this: Scene) {
        if (!this._gamepadManager) {
            this._gamepadManager = new GamepadManager(this);
            let component = this._getComponent(SceneComponentConstants.NAME_GAMEPAD) as GamepadSystemSceneComponent;
            if (!component) {
                component = new GamepadSystemSceneComponent(this);
                this._addComponent(component);
            }
        }

        return this._gamepadManager;
    },
    enumerable: true,
    configurable: true,
});


/**
 * Adds a gamepad to the free camera inputs manager
 * @returns the FreeCameraInputsManager
 */
FreeCameraInputsManager.prototype.addGamepad = function (): FreeCameraInputsManager {
    this.add(new FreeCameraGamepadInput());
    return this;
};


/**
 * Adds a gamepad to the arc rotate camera inputs manager
 * @returns the camera inputs manager
 */
ArcRotateCameraInputsManager.prototype.addGamepad = function (): ArcRotateCameraInputsManager {
    this.add(new ArcRotateCameraGamepadInput());
    return this;
};
