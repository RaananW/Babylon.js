/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import webXRGenericHandController.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webXRGenericHandController.pure";

import { WebXRMotionControllerManager } from "./webXRMotionControllerManager";
import type { Scene } from "../../scene";


// register the profiles
WebXRMotionControllerManager.RegisterController("generic-hand-select-grasp", (xrInput: XRInputSource, scene: Scene) => {
    return new WebXRGenericHandController(scene, <any>xrInput.gamepad, xrInput.handedness);
});
