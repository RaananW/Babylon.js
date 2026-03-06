/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import blackAndWhitePostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./blackAndWhitePostProcess.pure";

import { BlackAndWhitePostProcess } from "./blackAndWhitePostProcess.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.BlackAndWhitePostProcess", BlackAndWhitePostProcess);
