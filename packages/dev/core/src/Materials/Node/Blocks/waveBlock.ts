/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import waveBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./waveBlock.pure";

import { WaveBlock } from "./waveBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.WaveBlock", WaveBlock);
