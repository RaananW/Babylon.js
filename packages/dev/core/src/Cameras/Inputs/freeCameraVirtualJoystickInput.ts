/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import freeCameraVirtualJoystickInput.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./freeCameraVirtualJoystickInput.pure";

import { FreeCameraVirtualJoystickInput } from "./freeCameraVirtualJoystickInput.pure";
import { FreeCameraInputsManager } from "../../Cameras/freeCameraInputsManager";

declare module "../../Cameras/freeCameraInputsManager" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface FreeCameraInputsManager {
        /**
         * Add virtual joystick input support to the input manager.
         * @returns the current input manager
         */
        addVirtualJoystick(): FreeCameraInputsManager;
    }
}

/**
 * Add virtual joystick input support to the input manager.
 * @returns the current input manager
 */
FreeCameraInputsManager.prototype.addVirtualJoystick = function (): FreeCameraInputsManager {
    this.add(new FreeCameraVirtualJoystickInput());
    return this;
};
