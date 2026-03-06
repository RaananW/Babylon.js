/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import refractionPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./refractionPostProcess.pure";

import { RefractionPostProcess } from "./refractionPostProcess.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.RefractionPostProcess", RefractionPostProcess);
