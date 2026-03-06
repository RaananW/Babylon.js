/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleRandomBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleRandomBlock.pure";

import { ParticleRandomBlock } from "./particleRandomBlock.pure";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass("BABYLON.ParticleRandomBlock", ParticleRandomBlock);
