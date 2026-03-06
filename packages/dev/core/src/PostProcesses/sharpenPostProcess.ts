/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import sharpenPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sharpenPostProcess.pure";

import { SharpenPostProcess } from "./sharpenPostProcess.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.SharpenPostProcess", SharpenPostProcess);
