/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphIndexOfBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphIndexOfBlock.pure";

import { FlowGraphIndexOfBlock } from "./flowGraphIndexOfBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.IndexOf, FlowGraphIndexOfBlock);
