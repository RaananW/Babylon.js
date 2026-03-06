/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import scaleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./scaleBlock.pure";

import { ScaleBlock } from "./scaleBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ScaleBlock", ScaleBlock);
