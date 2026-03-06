/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphStopAnimationBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphStopAnimationBlock.pure";

import { FlowGraphStopAnimationBlock } from "./flowGraphStopAnimationBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.StopAnimation, FlowGraphStopAnimationBlock);
