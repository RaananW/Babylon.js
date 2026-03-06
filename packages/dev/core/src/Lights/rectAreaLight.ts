/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import rectAreaLight.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./rectAreaLight.pure";

import { RectAreaLight } from "./rectAreaLight.pure";
import { Vector3 } from "core/Maths/math.vector";
import { Node } from "core/node";
import { RegisterClass } from "core/Misc/typeStore";

Node.AddNodeConstructor("Light_Type_4", (name, scene) => {
    return () => new RectAreaLight(name, Vector3.Zero(), 1, 1, scene);
});

// Register Class Name
RegisterClass("BABYLON.RectAreaLight", RectAreaLight);
