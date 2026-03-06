/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import divideBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./divideBlock.pure";

import { DivideBlock } from "./divideBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.DivideBlock", DivideBlock);
