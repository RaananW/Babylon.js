/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleConditionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleConditionBlock.pure";

import { ParticleConditionBlock } from "./particleConditionBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.ParticleConditionBlock", ParticleConditionBlock);
