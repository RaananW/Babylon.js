/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphPlayAnimationBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPlayAnimationBlock.pure";

import { FlowGraphPlayAnimationBlock } from "./flowGraphPlayAnimationBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.PlayAnimation, FlowGraphPlayAnimationBlock);
