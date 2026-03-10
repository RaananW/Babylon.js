/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import webXRHTCViveMotionController.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webXRHTCViveMotionController.pure";

import { WebXRHTCViveMotionController } from "./webXRHTCViveMotionController.pure";
import type { Scene } from "../../scene";
import { WebXRMotionControllerManager } from "./webXRMotionControllerManager";

// register the profile
WebXRMotionControllerManager.RegisterController("htc-vive", (xrInput: XRInputSource, scene: Scene) => {
    return new WebXRHTCViveMotionController(scene, <any>xrInput.gamepad, xrInput.handedness);
});
