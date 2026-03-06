/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianSplattingGpuPickingMaterialPlugin.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingGpuPickingMaterialPlugin.pure";

import { GaussianSplattingGpuPickingMaterialPlugin } from "./gaussianSplattingGpuPickingMaterialPlugin.pure";
import { RegisterClass } from "../../Misc/typeStore";

RegisterClass("BABYLON.GaussianSplattingGpuPickingMaterialPlugin", GaussianSplattingGpuPickingMaterialPlugin);
