/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import followCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./followCamera.pure";

import { Vector3 } from "../Maths/math.vector";
import { Node } from "../node";
import { RegisterClass } from "../Misc/typeStore";


Node.AddNodeConstructor("FollowCamera", (name, scene) => {
    return () => new FollowCamera(name, Vector3.Zero(), scene);
});


Node.AddNodeConstructor("ArcFollowCamera", (name, scene) => {
    return () => new ArcFollowCamera(name, 0, 0, 1.0, null, scene);
});


// Register Class Name
RegisterClass("BABYLON.FollowCamera", FollowCamera);

RegisterClass("BABYLON.ArcFollowCamera", ArcFollowCamera);
