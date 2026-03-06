/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphDoNBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphDoNBlock.pure";

import { FlowGraphDoNBlock } from "./flowGraphDoNBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.DoN, FlowGraphDoNBlock);
