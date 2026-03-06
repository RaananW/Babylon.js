/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import negateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./negateBlock.pure";

import { NegateBlock } from "./negateBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.NegateBlock", NegateBlock);
