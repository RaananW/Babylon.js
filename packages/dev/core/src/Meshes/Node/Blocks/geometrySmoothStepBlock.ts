/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometrySmoothStepBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometrySmoothStepBlock.pure";

import { GeometrySmoothStepBlock } from "./geometrySmoothStepBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometrySmoothStepBlock", GeometrySmoothStepBlock);
