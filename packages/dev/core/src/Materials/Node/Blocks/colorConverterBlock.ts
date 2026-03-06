/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import colorConverterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./colorConverterBlock.pure";

import { ColorConverterBlock } from "./colorConverterBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ColorConverterBlock", ColorConverterBlock);
