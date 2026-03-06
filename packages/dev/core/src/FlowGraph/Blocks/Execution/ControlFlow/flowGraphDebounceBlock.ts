/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphDebounceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphDebounceBlock.pure";

import { FlowGraphDebounceBlock } from "./flowGraphDebounceBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.Debounce, FlowGraphDebounceBlock);
