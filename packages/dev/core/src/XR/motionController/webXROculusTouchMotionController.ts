/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import webXROculusTouchMotionController.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webXROculusTouchMotionController.pure";

import { WebXRMotionControllerManager } from "./webXRMotionControllerManager";
import type { Scene } from "../../scene";


// register the profile
WebXRMotionControllerManager.RegisterController("oculus-touch", (xrInput: XRInputSource, scene: Scene) => {
    return new WebXROculusTouchMotionController(scene, <any>xrInput.gamepad, xrInput.handedness);
});


WebXRMotionControllerManager.RegisterController("oculus-touch-legacy", (xrInput: XRInputSource, scene: Scene) => {
    return new WebXROculusTouchMotionController(scene, <any>xrInput.gamepad, xrInput.handedness, true);
});
