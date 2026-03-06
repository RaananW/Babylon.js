/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphConstantBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphConstantBlock.pure";

import { FlowGraphConstantBlock } from "./flowGraphConstantBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.Constant, FlowGraphConstantBlock);
