/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import worleyNoise3DBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./worleyNoise3DBlock.pure";

import { WorleyNoise3DBlock } from "./worleyNoise3DBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.WorleyNoise3DBlock", WorleyNoise3DBlock);
