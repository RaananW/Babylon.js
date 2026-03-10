/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import webXROculusTouchMotionController.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webXROculusTouchMotionController.pure";

import { WebXROculusTouchMotionController } from "./webXROculusTouchMotionController.pure";
import type { Scene } from "../../scene";
import { WebXRMotionControllerManager } from "./webXRMotionControllerManager";

// register the profile
WebXRMotionControllerManager.RegisterController("oculus-touch", (xrInput: XRInputSource, scene: Scene) => {
    return new WebXROculusTouchMotionController(scene, <any>xrInput.gamepad, xrInput.handedness);
});

WebXRMotionControllerManager.RegisterController("oculus-touch-legacy", (xrInput: XRInputSource, scene: Scene) => {
    return new WebXROculusTouchMotionController(scene, <any>xrInput.gamepad, xrInput.handedness, true);
});
