/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import setUVsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setUVsBlock.pure";

import { SetUVsBlock } from "./setUVsBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.SetUVsBlock", SetUVsBlock);
