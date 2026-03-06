/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import webgl2ParticleSystem.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webgl2ParticleSystem.pure";

import { WebGL2ParticleSystem } from "./webgl2ParticleSystem.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.WebGL2ParticleSystem", WebGL2ParticleSystem);
