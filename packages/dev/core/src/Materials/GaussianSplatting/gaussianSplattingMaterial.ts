/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianSplattingMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingMaterial.pure";

import { GaussianSplattingMaterial } from "./gaussianSplattingMaterial.pure";
import { RegisterClass } from "../../Misc/typeStore";

RegisterClass("BABYLON.GaussianSplattingMaterial", GaussianSplattingMaterial);
