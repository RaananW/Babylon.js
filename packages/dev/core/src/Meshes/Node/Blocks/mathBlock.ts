/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import mathBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./mathBlock.pure";

import { MathBlock } from "./mathBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.MathBlock", MathBlock);
