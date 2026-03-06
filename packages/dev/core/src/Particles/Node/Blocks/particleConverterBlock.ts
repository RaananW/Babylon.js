/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleConverterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleConverterBlock.pure";

import { ParticleConverterBlock } from "./particleConverterBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ParticleConverterBlock", ParticleConverterBlock);
