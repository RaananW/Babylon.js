/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import bloomMergePostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./bloomMergePostProcess.pure";

import { BloomMergePostProcess } from "./bloomMergePostProcess.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.BloomMergePostProcess", BloomMergePostProcess);
