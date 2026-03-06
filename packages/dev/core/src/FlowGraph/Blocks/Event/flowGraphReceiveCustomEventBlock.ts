/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphReceiveCustomEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphReceiveCustomEventBlock.pure";

import { FlowGraphReceiveCustomEventBlock } from "./flowGraphReceiveCustomEventBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.ReceiveCustomEvent, FlowGraphReceiveCustomEventBlock);
