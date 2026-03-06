/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import noiseBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./noiseBlock.pure";

import { NoiseBlock } from "./noiseBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.NoiseBlock", NoiseBlock);
