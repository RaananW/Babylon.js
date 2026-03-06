/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import vrDeviceOrientationGamepadCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./vrDeviceOrientationGamepadCamera.pure";

import { Vector3 } from "../../Maths/math.vector";
import { Node } from "../../node";


Node.AddNodeConstructor("VRDeviceOrientationGamepadCamera", (name, scene) => {
    return () => new VRDeviceOrientationGamepadCamera(name, Vector3.Zero(), scene);
});
