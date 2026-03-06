/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import customShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./customShapeBlock.pure";

import { CustomShapeBlock } from "./customShapeBlock.pure";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass("BABYLON.CustomShapeBlock", CustomShapeBlock);
