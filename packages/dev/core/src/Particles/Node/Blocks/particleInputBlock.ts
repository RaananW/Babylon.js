/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleInputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleInputBlock.pure";

import { ParticleInputBlock } from "./particleInputBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ParticleInputBlock", ParticleInputBlock);
