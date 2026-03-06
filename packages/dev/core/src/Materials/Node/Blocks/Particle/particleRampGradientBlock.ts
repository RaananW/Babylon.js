/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleRampGradientBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleRampGradientBlock.pure";

import { ParticleRampGradientBlock } from "./particleRampGradientBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.ParticleRampGradientBlock", ParticleRampGradientBlock);
