/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import prePassOutputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./prePassOutputBlock.pure";

import { PrePassOutputBlock } from "./prePassOutputBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.PrePassOutputBlock", PrePassOutputBlock);
