/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import curveBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./curveBlock.pure";

import { CurveBlock } from "./curveBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.CurveBlock", CurveBlock);
