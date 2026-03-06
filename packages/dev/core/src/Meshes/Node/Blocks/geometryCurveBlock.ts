/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryCurveBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryCurveBlock.pure";

import { GeometryCurveBlock } from "./geometryCurveBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryCurveBlock", GeometryCurveBlock);
