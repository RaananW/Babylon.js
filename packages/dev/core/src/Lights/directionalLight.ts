/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import directionalLight.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./directionalLight.pure";

import { Vector3 } from "../Maths/math.vector";
import { Node } from "../node";
import { RegisterClass } from "../Misc/typeStore";


Node.AddNodeConstructor("Light_Type_1", (name, scene) => {
    return () => new DirectionalLight(name, Vector3.Zero(), scene);
});


// Register Class Name
RegisterClass("BABYLON.DirectionalLight", DirectionalLight);
