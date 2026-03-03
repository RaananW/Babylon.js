/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import screenSpaceReflectionPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./screenSpaceReflectionPostProcess.pure";

import { RegisterClass } from "../Misc/typeStore";
import { ScreenSpaceReflectionPostProcess } from "./screenSpaceReflectionPostProcess.pure";

RegisterClass("BABYLON.ScreenSpaceReflectionPostProcess", ScreenSpaceReflectionPostProcess);
