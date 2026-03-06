/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fxaaPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fxaaPostProcess.pure";

import { FxaaPostProcess } from "./fxaaPostProcess.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.FxaaPostProcess", FxaaPostProcess);
