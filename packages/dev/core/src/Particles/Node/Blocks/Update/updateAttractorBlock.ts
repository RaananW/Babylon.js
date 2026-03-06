/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateAttractorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateAttractorBlock.pure";

import { UpdateAttractorBlock } from "./updateAttractorBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.UpdateAttractorBlock", UpdateAttractorBlock);
