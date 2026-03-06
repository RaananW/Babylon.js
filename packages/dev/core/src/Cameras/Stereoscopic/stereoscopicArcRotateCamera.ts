/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import stereoscopicArcRotateCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./stereoscopicArcRotateCamera.pure";

import { Vector3 } from "../../Maths/math.vector";
import { Node } from "../../node";


Node.AddNodeConstructor("StereoscopicArcRotateCamera", (name, scene, options) => {
    return () => new StereoscopicArcRotateCamera(name, 0, 0, 1.0, Vector3.Zero(), options.interaxial_distance, options.isStereoscopicSideBySide, scene);
});
