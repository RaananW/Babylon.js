/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import blurPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./blurPostProcess.pure";

import { BlurPostProcess } from "./blurPostProcess.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.BlurPostProcess", BlurPostProcess);
