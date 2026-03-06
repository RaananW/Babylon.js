/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import derivativeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./derivativeBlock.pure";

import { DerivativeBlock } from "./derivativeBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.DerivativeBlock", DerivativeBlock);
