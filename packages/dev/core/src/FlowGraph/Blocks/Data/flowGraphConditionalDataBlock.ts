/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphConditionalDataBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphConditionalDataBlock.pure";

import { FlowGraphConditionalDataBlock } from "./flowGraphConditionalDataBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.Conditional, FlowGraphConditionalDataBlock);
