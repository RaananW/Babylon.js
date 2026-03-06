/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import smoothStepBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./smoothStepBlock.pure";

import { SmoothStepBlock } from "./smoothStepBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.SmoothStepBlock", SmoothStepBlock);
