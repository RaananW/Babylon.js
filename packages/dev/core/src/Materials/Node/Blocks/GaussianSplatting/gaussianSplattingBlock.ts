/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianSplattingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingBlock.pure";

import { GaussianSplattingBlock } from "./gaussianSplattingBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.GaussianSplattingBlock", GaussianSplattingBlock);
