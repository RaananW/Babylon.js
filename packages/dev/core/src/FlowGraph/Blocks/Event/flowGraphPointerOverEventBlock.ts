/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphPointerOverEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPointerOverEventBlock.pure";

import { FlowGraphPointerOverEventBlock } from "./flowGraphPointerOverEventBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.PointerOverEvent, FlowGraphPointerOverEventBlock);
