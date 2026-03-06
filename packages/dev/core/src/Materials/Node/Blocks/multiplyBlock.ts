/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import multiplyBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./multiplyBlock.pure";

import { MultiplyBlock } from "./multiplyBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.MultiplyBlock", MultiplyBlock);
