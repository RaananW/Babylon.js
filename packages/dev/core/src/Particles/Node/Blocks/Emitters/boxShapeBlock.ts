/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import boxShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./boxShapeBlock.pure";

import { BoxShapeBlock } from "./boxShapeBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.BoxShapeBlock", BoxShapeBlock);
