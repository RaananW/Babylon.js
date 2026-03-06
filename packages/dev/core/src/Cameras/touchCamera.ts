/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import touchCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./touchCamera.pure";

import { Vector3 } from "../Maths/math.vector";
import { Node } from "../node";


Node.AddNodeConstructor("TouchCamera", (name, scene) => {
    return () => new TouchCamera(name, Vector3.Zero(), scene);
});
