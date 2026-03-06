/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import virtualJoysticksCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./virtualJoysticksCamera.pure";

import { VirtualJoysticksCamera } from "./virtualJoysticksCamera.pure";
import { Vector3 } from "../Maths/math.vector";
import { Node } from "../node";

Node.AddNodeConstructor("VirtualJoysticksCamera", (name, scene) => {
    return () => new VirtualJoysticksCamera(name, Vector3.Zero(), scene);
});
