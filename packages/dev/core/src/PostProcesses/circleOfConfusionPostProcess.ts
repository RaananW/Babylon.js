/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import circleOfConfusionPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./circleOfConfusionPostProcess.pure";

import { CircleOfConfusionPostProcess } from "./circleOfConfusionPostProcess.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.CircleOfConfusionPostProcess", CircleOfConfusionPostProcess);
