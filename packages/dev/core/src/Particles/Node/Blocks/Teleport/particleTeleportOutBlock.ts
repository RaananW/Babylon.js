/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleTeleportOutBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleTeleportOutBlock.pure";

import { ParticleTeleportOutBlock } from "./particleTeleportOutBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.ParticleTeleportOutBlock", ParticleTeleportOutBlock);
