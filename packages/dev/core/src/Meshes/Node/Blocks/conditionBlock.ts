/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import conditionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./conditionBlock.pure";

import { ConditionBlock } from "./conditionBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ConditionBlock", ConditionBlock);
