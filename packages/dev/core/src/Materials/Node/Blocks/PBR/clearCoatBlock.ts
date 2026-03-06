/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import clearCoatBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./clearCoatBlock.pure";

import { ClearCoatBlock } from "./clearCoatBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.ClearCoatBlock", ClearCoatBlock);
