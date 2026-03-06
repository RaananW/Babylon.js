/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import stereoscopicGamepadCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./stereoscopicGamepadCamera.pure";

import { Vector3 } from "../../Maths/math.vector";
import { Node } from "../../node";


Node.AddNodeConstructor("StereoscopicGamepadCamera", (name, scene, options) => {
    return () => new StereoscopicGamepadCamera(name, Vector3.Zero(), options.interaxial_distance, options.isStereoscopicSideBySide, scene);
});
