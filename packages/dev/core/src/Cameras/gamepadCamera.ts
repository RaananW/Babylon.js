/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gamepadCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gamepadCamera.pure";

import { GamepadCamera } from "./gamepadCamera.pure";
import { Vector3 } from "../Maths/math.vector";
import { Node } from "../node";

Node.AddNodeConstructor("GamepadCamera", (name, scene) => {
    return () => new GamepadCamera(name, Vector3.Zero(), scene);
});
