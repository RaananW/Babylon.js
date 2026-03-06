/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import filterPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./filterPostProcess.pure";

import { FilterPostProcess } from "./filterPostProcess.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.FilterPostProcess", FilterPostProcess);
