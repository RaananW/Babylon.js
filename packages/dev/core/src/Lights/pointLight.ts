/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import pointLight.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pointLight.pure";

import { PointLight } from "./pointLight.pure";
import { Vector3 } from "../Maths/math.vector";
import { Node } from "../node";
import { RegisterClass } from "../Misc/typeStore";

Node.AddNodeConstructor("Light_Type_0", (name, scene) => {
    return () => new PointLight(name, Vector3.Zero(), scene);
});

// Register Class Name
RegisterClass("BABYLON.PointLight", PointLight);
