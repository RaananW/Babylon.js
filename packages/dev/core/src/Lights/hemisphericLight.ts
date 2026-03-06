/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import hemisphericLight.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./hemisphericLight.pure";

import { HemisphericLight } from "./hemisphericLight.pure";
import { Vector3 } from "../Maths/math.vector";
import { Node } from "../node";
import { RegisterClass } from "../Misc/typeStore";

Node.AddNodeConstructor("Light_Type_3", (name, scene) => {
    return () => new HemisphericLight(name, Vector3.Zero(), scene);
});

// Register Class Name
RegisterClass("BABYLON.HemisphericLight", HemisphericLight);
