/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import webXRMicrosoftMixedRealityController.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webXRMicrosoftMixedRealityController.pure";

import { WebXRMicrosoftMixedRealityController } from "./webXRMicrosoftMixedRealityController.pure";
import { Scene } from "../../scene";
import { WebXRMotionControllerManager } from "./webXRMotionControllerManager";

// register the profile
WebXRMotionControllerManager.RegisterController("windows-mixed-reality", (xrInput: XRInputSource, scene: Scene) => {
    return new WebXRMicrosoftMixedRealityController(scene, <any>xrInput.gamepad, xrInput.handedness);
});
