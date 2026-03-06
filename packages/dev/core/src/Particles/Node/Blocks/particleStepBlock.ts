/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleStepBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleStepBlock.pure";

import { ParticleStepBlock } from "./particleStepBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ParticleStepBlock", ParticleStepBlock);
