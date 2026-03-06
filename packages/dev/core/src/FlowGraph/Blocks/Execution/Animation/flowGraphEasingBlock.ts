/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphEasingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphEasingBlock.pure";

import { FlowGraphEasingBlock } from "./flowGraphEasingBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.Easing, FlowGraphEasingBlock);
