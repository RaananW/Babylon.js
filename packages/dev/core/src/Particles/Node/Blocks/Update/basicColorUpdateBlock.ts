/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import basicColorUpdateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./basicColorUpdateBlock.pure";

import { BasicColorUpdateBlock } from "./basicColorUpdateBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.BasicColorUpdateBlock", BasicColorUpdateBlock);
