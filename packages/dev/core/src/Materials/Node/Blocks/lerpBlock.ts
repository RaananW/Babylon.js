/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import lerpBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./lerpBlock.pure";

import { LerpBlock } from "./lerpBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.LerpBlock", LerpBlock);
