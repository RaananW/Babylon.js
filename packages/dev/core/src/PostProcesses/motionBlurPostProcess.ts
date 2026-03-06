/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import motionBlurPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./motionBlurPostProcess.pure";

import { MotionBlurPostProcess } from "./motionBlurPostProcess.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.MotionBlurPostProcess", MotionBlurPostProcess);
