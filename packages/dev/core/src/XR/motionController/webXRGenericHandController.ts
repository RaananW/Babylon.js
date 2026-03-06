/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import webXRGenericHandController.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webXRGenericHandController.pure";

import { WebXRGenericHandController } from "./webXRGenericHandController.pure";
import { Scene } from "../../scene";
import { WebXRMotionControllerManager } from "./webXRMotionControllerManager";

// register the profiles
WebXRMotionControllerManager.RegisterController("generic-hand-select-grasp", (xrInput: XRInputSource, scene: Scene) => {
    return new WebXRGenericHandController(scene, <any>xrInput.gamepad, xrInput.handedness);
});
