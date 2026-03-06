/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import computeShaderParticleSystem.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./computeShaderParticleSystem.pure";

import { ComputeShaderParticleSystem } from "./computeShaderParticleSystem.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.ComputeShaderParticleSystem", ComputeShaderParticleSystem);
