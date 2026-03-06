/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import rotate2dBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./rotate2dBlock.pure";

import { Rotate2dBlock } from "./rotate2dBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.Rotate2dBlock", Rotate2dBlock);
