/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphWaitAllBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphWaitAllBlock.pure";

import { FlowGraphWaitAllBlock } from "./flowGraphWaitAllBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.WaitAll, FlowGraphWaitAllBlock);
