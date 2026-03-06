/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import tonemapPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./tonemapPostProcess.pure";

import { TonemapPostProcess } from "./tonemapPostProcess.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.TonemapPostProcess", TonemapPostProcess);
