/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import baseParticleSystem.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./baseParticleSystem.pure";

import { RegisterClass } from "../Misc/typeStore";
import { BaseParticleSystem } from "./baseParticleSystem.pure";

RegisterClass("BABYLON.BaseParticleSystem", BaseParticleSystem);
