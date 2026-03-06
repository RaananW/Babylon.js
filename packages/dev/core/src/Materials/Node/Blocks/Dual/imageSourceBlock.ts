/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import imageSourceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./imageSourceBlock.pure";

import { ImageSourceBlock } from "./imageSourceBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.ImageSourceBlock", ImageSourceBlock);
