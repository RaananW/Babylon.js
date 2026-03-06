/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import rotationXBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./rotationXBlock.pure";

import { RotationXBlock } from "./rotationXBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.RotationXBlock", RotationXBlock);
