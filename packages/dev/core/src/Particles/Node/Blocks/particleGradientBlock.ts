/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleGradientBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleGradientBlock.pure";

import { ParticleGradientBlock } from "./particleGradientBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ParticleGradientBlock", ParticleGradientBlock);
