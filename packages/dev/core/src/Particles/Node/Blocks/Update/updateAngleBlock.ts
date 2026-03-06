/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateAngleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateAngleBlock.pure";

import { UpdateAngleBlock } from "./updateAngleBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.UpdateAngleBlock", UpdateAngleBlock);
