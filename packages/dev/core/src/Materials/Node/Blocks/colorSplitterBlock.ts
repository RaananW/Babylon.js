/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import colorSplitterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./colorSplitterBlock.pure";

import { ColorSplitterBlock } from "./colorSplitterBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ColorSplitterBlock", ColorSplitterBlock);
