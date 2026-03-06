/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import displayPassPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./displayPassPostProcess.pure";

import { DisplayPassPostProcess } from "./displayPassPostProcess.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.DisplayPassPostProcess", DisplayPassPostProcess);
