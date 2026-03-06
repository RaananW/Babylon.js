/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import sphereShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sphereShapeBlock.pure";

import { SphereShapeBlock } from "./sphereShapeBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.SphereShapeBlock", SphereShapeBlock);
