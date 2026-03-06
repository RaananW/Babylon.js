/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import rotationZBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./rotationZBlock.pure";

import { RotationZBlock } from "./rotationZBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.RotationZBlock", RotationZBlock);
