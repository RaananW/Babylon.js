/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import chromaticAberrationPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./chromaticAberrationPostProcess.pure";

import { ChromaticAberrationPostProcess } from "./chromaticAberrationPostProcess.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.ChromaticAberrationPostProcess", ChromaticAberrationPostProcess);
