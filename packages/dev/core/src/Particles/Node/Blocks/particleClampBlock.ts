/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleClampBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleClampBlock.pure";

import { ParticleClampBlock } from "./particleClampBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ParticleClampBlock", ParticleClampBlock);
