/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import createParticleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./createParticleBlock.pure";

import { CreateParticleBlock } from "./createParticleBlock.pure";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass("BABYLON.CreateParticleBlock", CreateParticleBlock);
