/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import depthOfFieldBlurPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./depthOfFieldBlurPostProcess.pure";

import { DepthOfFieldBlurPostProcess } from "./depthOfFieldBlurPostProcess.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.DepthOfFieldBlurPostProcess", DepthOfFieldBlurPostProcess);
