/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import webgl2ParticleSystem.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webgl2ParticleSystem.pure";

import { RegisterClass } from "../Misc/typeStore";
import { WebGL2ParticleSystem } from "./webgl2ParticleSystem.pure";

RegisterClass("BABYLON.WebGL2ParticleSystem", WebGL2ParticleSystem);
