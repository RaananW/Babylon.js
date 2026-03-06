/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import grainPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./grainPostProcess.pure";

import { GrainPostProcess } from "./grainPostProcess.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.GrainPostProcess", GrainPostProcess);
