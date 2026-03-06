/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import imageProcessingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./imageProcessingBlock.pure";

import { ImageProcessingBlock } from "./imageProcessingBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.ImageProcessingBlock", ImageProcessingBlock);
