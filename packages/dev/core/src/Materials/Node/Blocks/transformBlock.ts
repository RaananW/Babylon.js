/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import transformBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./transformBlock.pure";

import { TransformBlock } from "./transformBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.TransformBlock", TransformBlock);
