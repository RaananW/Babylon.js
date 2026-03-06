/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphBranchBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphBranchBlock.pure";

import { FlowGraphBranchBlock } from "./flowGraphBranchBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.Branch, FlowGraphBranchBlock);
