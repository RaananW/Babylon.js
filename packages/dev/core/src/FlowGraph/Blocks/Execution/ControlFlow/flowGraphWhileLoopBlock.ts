/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphWhileLoopBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphWhileLoopBlock.pure";

import { FlowGraphWhileLoopBlock } from "./flowGraphWhileLoopBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.WhileLoop, FlowGraphWhileLoopBlock);
