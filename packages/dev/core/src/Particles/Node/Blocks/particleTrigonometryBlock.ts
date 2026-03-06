/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleTrigonometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleTrigonometryBlock.pure";

import { ParticleTrigonometryBlock } from "./particleTrigonometryBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ParticleTrigonometryBlock", ParticleTrigonometryBlock);
