/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import cylinderShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cylinderShapeBlock.pure";

import { CylinderShapeBlock } from "./cylinderShapeBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.CylinderShapeBlock", CylinderShapeBlock);
