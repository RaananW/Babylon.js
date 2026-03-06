/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import stereoscopicFreeCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./stereoscopicFreeCamera.pure";

import { Vector3 } from "../../Maths/math.vector";
import { Node } from "../../node";


Node.AddNodeConstructor("StereoscopicFreeCamera", (name, scene, options) => {
    return () => new StereoscopicFreeCamera(name, Vector3.Zero(), options.interaxial_distance, options.isStereoscopicSideBySide, scene);
});
