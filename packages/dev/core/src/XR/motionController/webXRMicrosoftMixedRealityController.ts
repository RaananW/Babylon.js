/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import webXRMicrosoftMixedRealityController.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webXRMicrosoftMixedRealityController.pure";

import { WebXRMotionControllerManager } from "./webXRMotionControllerManager";
import type { Scene } from "../../scene";


// register the profile
WebXRMotionControllerManager.RegisterController("windows-mixed-reality", (xrInput: XRInputSource, scene: Scene) => {
    return new WebXRMicrosoftMixedRealityController(scene, <any>xrInput.gamepad, xrInput.handedness);
});
