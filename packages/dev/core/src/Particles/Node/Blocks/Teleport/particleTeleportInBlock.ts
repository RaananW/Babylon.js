/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleTeleportInBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleTeleportInBlock.pure";

import { ParticleTeleportInBlock } from "./particleTeleportInBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.ParticleTeleportInBlock", ParticleTeleportInBlock);
