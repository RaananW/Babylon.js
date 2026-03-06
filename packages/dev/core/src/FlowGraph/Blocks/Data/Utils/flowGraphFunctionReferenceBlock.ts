/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphFunctionReferenceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphFunctionReferenceBlock.pure";

import { FlowGraphFunctionReferenceBlock } from "./flowGraphFunctionReferenceBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.FunctionReference, FlowGraphFunctionReferenceBlock);
