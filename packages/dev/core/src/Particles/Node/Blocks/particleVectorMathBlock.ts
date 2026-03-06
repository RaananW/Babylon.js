/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleVectorMathBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleVectorMathBlock.pure";

import { ParticleVectorMathBlock } from "./particleVectorMathBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ParticleVectorMathBlock", ParticleVectorMathBlock);
