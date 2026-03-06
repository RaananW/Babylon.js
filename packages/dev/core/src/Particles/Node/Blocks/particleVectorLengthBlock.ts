/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleVectorLengthBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleVectorLengthBlock.pure";

import { ParticleVectorLengthBlock } from "./particleVectorLengthBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ParticleVectorLengthBlock", ParticleVectorLengthBlock);
