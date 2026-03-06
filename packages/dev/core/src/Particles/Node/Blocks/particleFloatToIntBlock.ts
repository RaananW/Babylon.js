/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleFloatToIntBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleFloatToIntBlock.pure";

import { ParticleFloatToIntBlock } from "./particleFloatToIntBlock.pure";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass("BABYLON.ParticleFloatToIntBlock", ParticleFloatToIntBlock);
