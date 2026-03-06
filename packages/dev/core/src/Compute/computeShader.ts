/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import computeShader.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./computeShader.pure";

import { ComputeShader } from "./computeShader.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.ComputeShader", ComputeShader);
