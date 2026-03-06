/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import noiseProceduralTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./noiseProceduralTexture.pure";

import { NoiseProceduralTexture } from "./noiseProceduralTexture.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.NoiseProceduralTexture", NoiseProceduralTexture);
