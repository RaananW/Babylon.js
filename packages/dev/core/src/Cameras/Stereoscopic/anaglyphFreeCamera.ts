/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import anaglyphFreeCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./anaglyphFreeCamera.pure";

import { Vector3 } from "../../Maths/math.vector";
import { Node } from "../../node";


Node.AddNodeConstructor("AnaglyphFreeCamera", (name, scene, options) => {
    return () => new AnaglyphFreeCamera(name, Vector3.Zero(), options.interaxial_distance, scene);
});
