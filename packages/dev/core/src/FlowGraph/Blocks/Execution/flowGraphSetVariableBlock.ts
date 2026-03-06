/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSetVariableBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSetVariableBlock.pure";

import { FlowGraphSetVariableBlock } from "./flowGraphSetVariableBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.SetVariable, FlowGraphSetVariableBlock);
