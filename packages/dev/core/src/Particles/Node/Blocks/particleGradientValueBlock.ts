/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleGradientValueBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleGradientValueBlock.pure";

import { ParticleGradientValueBlock } from "./particleGradientValueBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ParticleGradientValueBlock", ParticleGradientValueBlock);
