/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import randomBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./randomBlock.pure";

import { RandomBlock } from "./randomBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.RandomBlock", RandomBlock);
