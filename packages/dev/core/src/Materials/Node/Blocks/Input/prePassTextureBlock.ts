/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import prePassTextureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./prePassTextureBlock.pure";

import { PrePassTextureBlock } from "./prePassTextureBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.PrePassTextureBlock", PrePassTextureBlock);
