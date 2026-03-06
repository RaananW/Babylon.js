/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSetDelayBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSetDelayBlock.pure";

import { FlowGraphSetDelayBlock } from "./flowGraphSetDelayBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.SetDelay, FlowGraphSetDelayBlock);
