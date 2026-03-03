/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import noiseProceduralTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./noiseProceduralTexture.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { NoiseProceduralTexture } from "./noiseProceduralTexture.pure";

RegisterClass("BABYLON.NoiseProceduralTexture", NoiseProceduralTexture);
