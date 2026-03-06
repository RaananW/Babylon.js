/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleTriggerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleTriggerBlock.pure";

import { ParticleTriggerBlock } from "./particleTriggerBlock.pure";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass("BABYLON.ParticleTriggerBlock", ParticleTriggerBlock);
