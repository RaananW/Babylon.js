/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphArrayIndexBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphArrayIndexBlock.pure";

import { FlowGraphArrayIndexBlock } from "./flowGraphArrayIndexBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.ArrayIndex, FlowGraphArrayIndexBlock);
