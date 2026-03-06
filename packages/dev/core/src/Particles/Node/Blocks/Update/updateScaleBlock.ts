/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateScaleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateScaleBlock.pure";

import { UpdateScaleBlock } from "./updateScaleBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.UpdateScaleBlock", UpdateScaleBlock);
