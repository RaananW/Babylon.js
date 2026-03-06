/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import capsuleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./capsuleBlock.pure";

import { CapsuleBlock } from "./capsuleBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.CapsuleBlock", CapsuleBlock);
