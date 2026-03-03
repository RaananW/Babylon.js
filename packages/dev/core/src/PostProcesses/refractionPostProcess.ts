/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import refractionPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./refractionPostProcess.pure";

import { RegisterClass } from "../Misc/typeStore";
import { RefractionPostProcess } from "./refractionPostProcess.pure";

RegisterClass("BABYLON.RefractionPostProcess", RefractionPostProcess);
