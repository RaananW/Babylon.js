/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import intFloatConverterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./intFloatConverterBlock.pure";

import { IntFloatConverterBlock } from "./intFloatConverterBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.IntFloatConverterBlock", IntFloatConverterBlock);
