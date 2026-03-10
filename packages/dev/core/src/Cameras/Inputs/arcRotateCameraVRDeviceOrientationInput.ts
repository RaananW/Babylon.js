/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import arcRotateCameraVRDeviceOrientationInput.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./arcRotateCameraVRDeviceOrientationInput.pure";

import { ArcRotateCameraVRDeviceOrientationInput } from "./arcRotateCameraVRDeviceOrientationInput.pure";
import { ArcRotateCameraInputsManager } from "../../Cameras/arcRotateCameraInputsManager";

declare module "../../Cameras/arcRotateCameraInputsManager" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface ArcRotateCameraInputsManager {
        /**
         * Add orientation input support to the input manager.
         * @returns the current input manager
         */
        addVRDeviceOrientation(): ArcRotateCameraInputsManager;
    }
}

/**
 * Add orientation input support to the input manager.
 * @returns the current input manager
 */
ArcRotateCameraInputsManager.prototype.addVRDeviceOrientation = function (): ArcRotateCameraInputsManager {
    this.add(new ArcRotateCameraVRDeviceOrientationInput());
    return this;
};
