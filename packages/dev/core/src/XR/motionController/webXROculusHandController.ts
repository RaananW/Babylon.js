/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import webXROculusHandController.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webXROculusHandController.pure";

import { WebXRMotionControllerManager } from "./webXRMotionControllerManager";
import type { Scene } from "../../scene";


// register the profiles
WebXRMotionControllerManager.RegisterController("oculus-hand", (xrInput: XRInputSource, scene: Scene) => {
    return new WebXROculusHandController(scene, <any>xrInput.gamepad, xrInput.handedness);
});
