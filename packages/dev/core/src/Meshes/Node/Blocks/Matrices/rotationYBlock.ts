/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import rotationYBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./rotationYBlock.pure";

import { RotationYBlock } from "./rotationYBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.RotationYBlock", RotationYBlock);
