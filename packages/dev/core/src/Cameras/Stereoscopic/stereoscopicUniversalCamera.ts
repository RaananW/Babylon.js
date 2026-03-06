/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import stereoscopicUniversalCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./stereoscopicUniversalCamera.pure";

import { StereoscopicUniversalCamera } from "./stereoscopicUniversalCamera.pure";
import { Vector3 } from "../../Maths/math.vector";
import { Node } from "../../node";

Node.AddNodeConstructor("StereoscopicFreeCamera", (name, scene, options) => {
    return () => new StereoscopicUniversalCamera(name, Vector3.Zero(), options.interaxial_distance, options.isStereoscopicSideBySide, scene);
});
