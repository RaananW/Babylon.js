/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import motionBlurPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./motionBlurPostProcess.pure";

import { RegisterClass } from "../Misc/typeStore";
import { MotionBlurPostProcess } from "./motionBlurPostProcess.pure";

RegisterClass("BABYLON.MotionBlurPostProcess", MotionBlurPostProcess);
