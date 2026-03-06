/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleMathBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleMathBlock.pure";

import { ParticleMathBlock } from "./particleMathBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ParticleMathBlock", ParticleMathBlock);
