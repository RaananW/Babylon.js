/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import vrDeviceOrientationFreeCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./vrDeviceOrientationFreeCamera.pure";

import { Vector3 } from "../../Maths/math.vector";
import { Node } from "../../node";


Node.AddNodeConstructor("VRDeviceOrientationFreeCamera", (name, scene) => {
    return () => new VRDeviceOrientationFreeCamera(name, Vector3.Zero(), scene);
});
