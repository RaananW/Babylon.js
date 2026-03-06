/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import discardBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./discardBlock.pure";

import { DiscardBlock } from "./discardBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.DiscardBlock", DiscardBlock);
