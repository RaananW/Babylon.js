/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import basicPositionUpdateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./basicPositionUpdateBlock.pure";

import { BasicPositionUpdateBlock } from "./basicPositionUpdateBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.BasicPositionUpdateBlock", BasicPositionUpdateBlock);
