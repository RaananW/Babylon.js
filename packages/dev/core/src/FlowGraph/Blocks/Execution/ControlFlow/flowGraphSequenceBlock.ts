/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSequenceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSequenceBlock.pure";

import { FlowGraphSequenceBlock } from "./flowGraphSequenceBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.Sequence, FlowGraphSequenceBlock);
