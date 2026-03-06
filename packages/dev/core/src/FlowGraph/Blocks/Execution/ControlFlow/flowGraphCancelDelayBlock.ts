/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphCancelDelayBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphCancelDelayBlock.pure";

import { FlowGraphCancelDelayBlock } from "./flowGraphCancelDelayBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.CancelDelay, FlowGraphCancelDelayBlock);
