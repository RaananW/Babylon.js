/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphForLoopBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphForLoopBlock.pure";

import { FlowGraphForLoopBlock } from "./flowGraphForLoopBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.ForLoop, FlowGraphForLoopBlock);
