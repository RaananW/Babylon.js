/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import colorMergerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./colorMergerBlock.pure";

import { ColorMergerBlock } from "./colorMergerBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ColorMergerBlock", ColorMergerBlock);
