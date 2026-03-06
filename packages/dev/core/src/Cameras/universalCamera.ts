/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import universalCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./universalCamera.pure";

import { Node } from "../node";
import { Vector3 } from "../Maths/math.vector";
import { Camera } from "./camera";
import type { Scene } from "../scene";


Node.AddNodeConstructor("FreeCamera", (name, scene) => {
    // Forcing to use the Universal camera
    return () => new UniversalCamera(name, Vector3.Zero(), scene);
});


Camera._CreateDefaultParsedCamera = (name: string, scene: Scene) => {
    return new UniversalCamera(name, Vector3.Zero(), scene);
};
