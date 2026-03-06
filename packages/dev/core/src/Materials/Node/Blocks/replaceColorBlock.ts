/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import replaceColorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./replaceColorBlock.pure";

import { ReplaceColorBlock } from "./replaceColorBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ReplaceColorBlock", ReplaceColorBlock);
