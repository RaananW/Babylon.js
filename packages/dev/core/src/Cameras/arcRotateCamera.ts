/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import arcRotateCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./arcRotateCamera.pure";

import { ArcRotateCamera } from "./arcRotateCamera.pure";
import { Vector3 } from "../Maths/math.vector";
import { Node } from "../node";
import { RegisterClass } from "../Misc/typeStore";

Node.AddNodeConstructor("ArcRotateCamera", (name, scene) => {
    return () => new ArcRotateCamera(name, 0, 0, 1.0, Vector3.Zero(), scene);
});

// Register Class Name
RegisterClass("BABYLON.ArcRotateCamera", ArcRotateCamera);
