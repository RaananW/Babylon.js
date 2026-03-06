/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import TBNBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./TBNBlock.pure";

import { TBNBlock } from "./TBNBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.TBNBlock", TBNBlock);
