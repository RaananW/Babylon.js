/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import nLerpBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./nLerpBlock.pure";

import { NLerpBlock } from "./nLerpBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.NLerpBlock", NLerpBlock);
