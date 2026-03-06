/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import heightToNormalBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./heightToNormalBlock.pure";

import { HeightToNormalBlock } from "./heightToNormalBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.HeightToNormalBlock", HeightToNormalBlock);
