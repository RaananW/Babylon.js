/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import sharpenPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sharpenPostProcess.pure";

import { RegisterClass } from "../Misc/typeStore";
import { SharpenPostProcess } from "./sharpenPostProcess.pure";

RegisterClass("BABYLON.SharpenPostProcess", SharpenPostProcess);
