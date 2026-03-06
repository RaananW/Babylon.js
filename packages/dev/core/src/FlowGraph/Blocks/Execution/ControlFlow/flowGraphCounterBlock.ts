/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphCounterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphCounterBlock.pure";

import { FlowGraphCallCounterBlock } from "./flowGraphCounterBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.CallCounter, FlowGraphCallCounterBlock);
