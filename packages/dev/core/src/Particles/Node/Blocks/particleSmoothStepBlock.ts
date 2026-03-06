/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleSmoothStepBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleSmoothStepBlock.pure";

import { ParticleSmoothStepBlock } from "./particleSmoothStepBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ParticleSmoothStepBlock", ParticleSmoothStepBlock);
