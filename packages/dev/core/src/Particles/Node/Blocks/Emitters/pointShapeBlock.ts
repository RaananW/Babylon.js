/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import pointShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pointShapeBlock.pure";

import { PointShapeBlock } from "./pointShapeBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.PointShapeBlock", PointShapeBlock);
