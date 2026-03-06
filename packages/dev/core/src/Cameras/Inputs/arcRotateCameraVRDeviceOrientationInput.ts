/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import arcRotateCameraVRDeviceOrientationInput.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./arcRotateCameraVRDeviceOrientationInput.pure";

import { ArcRotateCameraVRDeviceOrientationInput } from "./arcRotateCameraVRDeviceOrientationInput.pure";
import { ArcRotateCameraInputsManager } from "../../Cameras/arcRotateCameraInputsManager";

/**
 * Add orientation input support to the input manager.
 * @returns the current input manager
 */
ArcRotateCameraInputsManager.prototype.addVRDeviceOrientation = function (): ArcRotateCameraInputsManager {
    this.add(new ArcRotateCameraVRDeviceOrientationInput());
    return this;
};
