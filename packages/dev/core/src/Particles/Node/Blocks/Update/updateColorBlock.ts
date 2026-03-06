/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateColorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateColorBlock.pure";

import { UpdateColorBlock } from "./updateColorBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.UpdateColorBlock", UpdateColorBlock);
