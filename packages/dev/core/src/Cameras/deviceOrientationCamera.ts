/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import deviceOrientationCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./deviceOrientationCamera.pure";

import { DeviceOrientationCamera } from "./deviceOrientationCamera.pure";
import { Vector3 } from "../Maths/math.vector";
import { Node } from "../node";

Node.AddNodeConstructor("DeviceOrientationCamera", (name, scene) => {
    return () => new DeviceOrientationCamera(name, Vector3.Zero(), scene);
});
