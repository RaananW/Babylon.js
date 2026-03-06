/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import vectorSplitterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./vectorSplitterBlock.pure";

import { VectorSplitterBlock } from "./vectorSplitterBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.VectorSplitterBlock", VectorSplitterBlock);
