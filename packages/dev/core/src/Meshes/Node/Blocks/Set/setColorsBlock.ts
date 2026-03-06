/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import setColorsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setColorsBlock.pure";

import { SetColorsBlock } from "./setColorsBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.SetColorsBlock", SetColorsBlock);
