/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import scalingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./scalingBlock.pure";

import { ScalingBlock } from "./scalingBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.ScalingBlock", ScalingBlock);
