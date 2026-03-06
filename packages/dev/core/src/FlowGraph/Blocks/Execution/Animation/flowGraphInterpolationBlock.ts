/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphInterpolationBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphInterpolationBlock.pure";

import { FlowGraphInterpolationBlock } from "./flowGraphInterpolationBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.ValueInterpolation, FlowGraphInterpolationBlock);
