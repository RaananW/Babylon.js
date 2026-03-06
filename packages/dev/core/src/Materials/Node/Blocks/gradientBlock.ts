/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gradientBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gradientBlock.pure";

import { GradientBlock } from "./gradientBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GradientBlock", GradientBlock);
