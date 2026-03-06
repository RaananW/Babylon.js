/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import anaglyphArcRotateCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./anaglyphArcRotateCamera.pure";

import { AnaglyphArcRotateCamera } from "./anaglyphArcRotateCamera.pure";
import { Vector3 } from "../../Maths/math.vector";
import { Node } from "../../node";

Node.AddNodeConstructor("AnaglyphArcRotateCamera", (name, scene, options) => {
    return () => new AnaglyphArcRotateCamera(name, 0, 0, 1.0, Vector3.Zero(), options.interaxial_distance, scene);
});
