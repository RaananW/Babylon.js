/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphPointerOutEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPointerOutEventBlock.pure";

import { FlowGraphPointerOutEventBlock } from "./flowGraphPointerOutEventBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.PointerOutEvent, FlowGraphPointerOutEventBlock);
