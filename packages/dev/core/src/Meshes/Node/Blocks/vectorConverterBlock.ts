/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import vectorConverterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./vectorConverterBlock.pure";

import { VectorConverterBlock } from "./vectorConverterBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.VectorConverterBlock", VectorConverterBlock);
