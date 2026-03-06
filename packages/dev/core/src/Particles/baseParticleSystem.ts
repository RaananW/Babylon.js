/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import baseParticleSystem.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./baseParticleSystem.pure";

import { BaseParticleSystem } from "./baseParticleSystem.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.BaseParticleSystem", BaseParticleSystem);
