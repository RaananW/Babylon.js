/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleElbowBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleElbowBlock.pure";

import { ParticleElbowBlock } from "./particleElbowBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ParticleElbowBlock", ParticleElbowBlock);
