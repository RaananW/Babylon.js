/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import convolutionPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./convolutionPostProcess.pure";

import { ConvolutionPostProcess } from "./convolutionPostProcess.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.ConvolutionPostProcess", ConvolutionPostProcess);
