/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphThrottleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphThrottleBlock.pure";

import { FlowGraphThrottleBlock } from "./flowGraphThrottleBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.Throttle, FlowGraphThrottleBlock);
