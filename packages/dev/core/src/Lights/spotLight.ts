/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import spotLight.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./spotLight.pure";

import { SpotLight } from "./spotLight.pure";
import { Vector3 } from "../Maths/math.vector";
import { Node } from "../node";
import { RegisterClass } from "../Misc/typeStore";

Node.AddNodeConstructor("Light_Type_2", (name, scene) => {
    return () => new SpotLight(name, Vector3.Zero(), Vector3.Zero(), 0, 0, scene);
});

// Register Class Name
RegisterClass("BABYLON.SpotLight", SpotLight);
