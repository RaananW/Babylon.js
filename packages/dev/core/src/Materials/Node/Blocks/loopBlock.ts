/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import loopBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./loopBlock.pure";

import { LoopBlock } from "./loopBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.LoopBlock", LoopBlock);
