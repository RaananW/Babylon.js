/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleSystem.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleSystem.pure";

import { ParticleSystem } from "./particleSystem.pure";
import { SubEmitter } from "./subEmitter";

SubEmitter._ParseParticleSystem = ParticleSystem.Parse;
