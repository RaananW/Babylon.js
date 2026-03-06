/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import sound.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sound.pure";

import { Sound } from "./sound.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.Sound", Sound);
