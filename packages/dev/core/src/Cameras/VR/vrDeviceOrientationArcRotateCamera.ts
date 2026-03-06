/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import vrDeviceOrientationArcRotateCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./vrDeviceOrientationArcRotateCamera.pure";

import { VRDeviceOrientationArcRotateCamera } from "./vrDeviceOrientationArcRotateCamera.pure";
import { Vector3 } from "../../Maths/math.vector";
import { Node } from "../../node";

Node.AddNodeConstructor("VRDeviceOrientationArcRotateCamera", (name, scene) => {
    return () => new VRDeviceOrientationArcRotateCamera(name, 0, 0, 1.0, Vector3.Zero(), scene);
});
