/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphGetVariableBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphGetVariableBlock.pure";

import { FlowGraphGetVariableBlock } from "./flowGraphGetVariableBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.GetVariable, FlowGraphGetVariableBlock);
