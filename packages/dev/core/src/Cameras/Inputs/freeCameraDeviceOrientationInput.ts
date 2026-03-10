/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import freeCameraDeviceOrientationInput.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./freeCameraDeviceOrientationInput.pure";

import { FreeCameraDeviceOrientationInput } from "./freeCameraDeviceOrientationInput.pure";
import { FreeCameraInputsManager } from "../../Cameras/freeCameraInputsManager";
import type { Nullable } from "../../types";

declare module "../../Cameras/freeCameraInputsManager" {
    /**
     *
     */
    export interface FreeCameraInputsManager {
        /**
         * @internal
         */
        _deviceOrientationInput: Nullable<FreeCameraDeviceOrientationInput>;
        /**
         * Add orientation input support to the input manager.
         * @param smoothFactor deviceOrientation smoothing. 0: no smoothing, 1: new data ignored, 0.9 recommended for smoothing
         * @returns the current input manager
         */
        addDeviceOrientation(smoothFactor?: number): FreeCameraInputsManager;
    }
}

/**
 * Add orientation input support to the input manager.
 * @param smoothFactor deviceOrientation smoothing. 0: no smoothing, 1: new data ignored, 0.9 recommended for smoothing
 * @returns the current input manager
 */
FreeCameraInputsManager.prototype.addDeviceOrientation = function (smoothFactor?: number): FreeCameraInputsManager {
    if (!this._deviceOrientationInput) {
        this._deviceOrientationInput = new FreeCameraDeviceOrientationInput();
        if (smoothFactor) {
            this._deviceOrientationInput.smoothFactor = smoothFactor;
        }
        this.add(this._deviceOrientationInput);
    }

    return this;
};
