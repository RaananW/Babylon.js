/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import anaglyphPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./anaglyphPostProcess.pure";

import { AnaglyphPostProcess } from "./anaglyphPostProcess.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.AnaglyphPostProcess", AnaglyphPostProcess);
