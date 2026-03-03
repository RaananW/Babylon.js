/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import screenSpaceCurvaturePostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./screenSpaceCurvaturePostProcess.pure";

import { RegisterClass } from "../Misc/typeStore";
import { ScreenSpaceCurvaturePostProcess } from "./screenSpaceCurvaturePostProcess.pure";

RegisterClass("BABYLON.ScreenSpaceCurvaturePostProcess", ScreenSpaceCurvaturePostProcess);
