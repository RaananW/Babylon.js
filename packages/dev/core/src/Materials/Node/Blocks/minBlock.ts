/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import minBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./minBlock.pure";

import { MinBlock } from "./minBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.MinBlock", MinBlock);
