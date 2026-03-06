/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import computeNormalsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./computeNormalsBlock.pure";

import { ComputeNormalsBlock } from "./computeNormalsBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ComputeNormalsBlock", ComputeNormalsBlock);
