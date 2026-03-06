/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import webXRMotionControllerManager.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webXRMotionControllerManager.pure";

import { WebXRGenericTriggerMotionController } from "./webXRGenericMotionController";
import type { Scene } from "../../scene";


// register the generic profile(s) here so we will at least have them
WebXRMotionControllerManager.RegisterController(WebXRGenericTriggerMotionController.ProfileId, (xrInput: XRInputSource, scene: Scene) => {
    return new WebXRGenericTriggerMotionController(scene, <any>xrInput.gamepad, xrInput.handedness);
});


// register fallbacks
WebXRMotionControllerManager.DefaultFallbacks();
