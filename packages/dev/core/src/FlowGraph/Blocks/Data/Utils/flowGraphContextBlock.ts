/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphContextBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphContextBlock.pure";

import { FlowGraphContextBlock } from "./flowGraphContextBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.Context, FlowGraphContextBlock);
