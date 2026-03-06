/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleTextureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleTextureBlock.pure";

import { ParticleTextureBlock } from "./particleTextureBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.ParticleTextureBlock", ParticleTextureBlock);
