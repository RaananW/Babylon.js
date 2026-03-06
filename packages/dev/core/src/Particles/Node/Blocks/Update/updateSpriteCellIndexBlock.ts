/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateSpriteCellIndexBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateSpriteCellIndexBlock.pure";

import { UpdateSpriteCellIndexBlock } from "./updateSpriteCellIndexBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.UpdateSpriteCellIndexBlock", UpdateSpriteCellIndexBlock);
