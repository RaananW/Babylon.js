/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateSizeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateSizeBlock.pure";

import { UpdateSizeBlock } from "./updateSizeBlock.pure";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass("BABYLON.UpdateSizeBlock", UpdateSizeBlock);
