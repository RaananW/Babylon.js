/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import freeCameraVirtualJoystickInput.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./freeCameraVirtualJoystickInput.pure";

import { FreeCameraVirtualJoystickInput } from "./freeCameraVirtualJoystickInput.pure";
import { FreeCameraInputsManager } from "../../Cameras/freeCameraInputsManager";

/**
 * Add virtual joystick input support to the input manager.
 * @returns the current input manager
 */
FreeCameraInputsManager.prototype.addVirtualJoystick = function (): FreeCameraInputsManager {
    this.add(new FreeCameraVirtualJoystickInput());
    return this;
};
