/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianSplattingSolidColorMaterialPlugin.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingSolidColorMaterialPlugin.pure";

import { GaussianSplattingSolidColorMaterialPlugin } from "./gaussianSplattingSolidColorMaterialPlugin.pure";
import { RegisterClass } from "../../Misc/typeStore";

RegisterClass("BABYLON.GaussianSplattingSolidColorMaterialPlugin", GaussianSplattingSolidColorMaterialPlugin);
