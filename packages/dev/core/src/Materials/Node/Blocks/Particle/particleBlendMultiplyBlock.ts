/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleBlendMultiplyBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleBlendMultiplyBlock.pure";

import { ParticleBlendMultiplyBlock } from "./particleBlendMultiplyBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.ParticleBlendMultiplyBlock", ParticleBlendMultiplyBlock);
