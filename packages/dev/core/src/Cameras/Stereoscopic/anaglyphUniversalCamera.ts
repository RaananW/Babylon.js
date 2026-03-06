/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import anaglyphUniversalCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./anaglyphUniversalCamera.pure";

import { Vector3 } from "../../Maths/math.vector";
import { Node } from "../../node";


Node.AddNodeConstructor("AnaglyphUniversalCamera", (name, scene, options) => {
    return () => new AnaglyphUniversalCamera(name, Vector3.Zero(), options.interaxial_distance, scene);
});
