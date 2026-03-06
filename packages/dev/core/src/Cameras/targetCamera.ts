/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import targetCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./targetCamera.pure";

import { Vector3 } from "../Maths/math.vector";
import { Node } from "../node";


Node.AddNodeConstructor("TargetCamera", (name, scene) => {
    return () => new TargetCamera(name, Vector3.Zero(), scene);
});
