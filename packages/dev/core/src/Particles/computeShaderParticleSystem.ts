/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import computeShaderParticleSystem.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./computeShaderParticleSystem.pure";

import { RegisterClass } from "../Misc/typeStore";
import { ComputeShaderParticleSystem } from "./computeShaderParticleSystem.pure";

RegisterClass("BABYLON.ComputeShaderParticleSystem", ComputeShaderParticleSystem);
