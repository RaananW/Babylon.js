/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import lightBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./lightBlock.pure";

import { LightBlock } from "./lightBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.LightBlock", LightBlock);
