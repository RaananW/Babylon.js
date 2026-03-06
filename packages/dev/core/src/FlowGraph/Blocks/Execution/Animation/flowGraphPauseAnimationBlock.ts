/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphPauseAnimationBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPauseAnimationBlock.pure";

import { FlowGraphPauseAnimationBlock } from "./flowGraphPauseAnimationBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.PauseAnimation, FlowGraphPauseAnimationBlock);
