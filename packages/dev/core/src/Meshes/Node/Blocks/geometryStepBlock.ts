/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryStepBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryStepBlock.pure";

import { GeometryStepBlock } from "./geometryStepBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryStepBlock", GeometryStepBlock);
