/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import basicSpriteUpdateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./basicSpriteUpdateBlock.pure";

import { BasicSpriteUpdateBlock } from "./basicSpriteUpdateBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.BasicSpriteUpdateBlock", BasicSpriteUpdateBlock);
