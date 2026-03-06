/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import setupSpriteSheetBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setupSpriteSheetBlock.pure";

import { SetupSpriteSheetBlock } from "./setupSpriteSheetBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.SetupSpriteSheetBlock", SetupSpriteSheetBlock);
