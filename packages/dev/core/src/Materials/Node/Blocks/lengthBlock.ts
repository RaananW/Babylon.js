/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import lengthBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./lengthBlock.pure";

import { LengthBlock } from "./lengthBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.LengthBlock", LengthBlock);
