/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleLocalVariableBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleLocalVariableBlock.pure";

import { ParticleLocalVariableBlock } from "./particleLocalVariableBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ParticleLocalVariableBlock", ParticleLocalVariableBlock);
