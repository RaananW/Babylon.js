/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import randomNumberBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./randomNumberBlock.pure";

import { RandomNumberBlock } from "./randomNumberBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.RandomNumberBlock", RandomNumberBlock);
