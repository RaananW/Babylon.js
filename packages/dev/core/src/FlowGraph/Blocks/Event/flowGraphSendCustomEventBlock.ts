/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSendCustomEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSendCustomEventBlock.pure";

import { FlowGraphSendCustomEventBlock } from "./flowGraphSendCustomEventBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.ReceiveCustomEvent, FlowGraphSendCustomEventBlock);
