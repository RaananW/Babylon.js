/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import anaglyphGamepadCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./anaglyphGamepadCamera.pure";

import { AnaglyphGamepadCamera } from "./anaglyphGamepadCamera.pure";
import { Vector3 } from "../../Maths/math.vector";
import { Node } from "../../node";

Node.AddNodeConstructor("AnaglyphGamepadCamera", (name, scene, options) => {
    return () => new AnaglyphGamepadCamera(name, Vector3.Zero(), options.interaxial_distance, scene);
});
