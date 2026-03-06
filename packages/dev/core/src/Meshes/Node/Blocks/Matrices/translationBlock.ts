/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import translationBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./translationBlock.pure";

import { TranslationBlock } from "./translationBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.TranslationBlock", TranslationBlock);
