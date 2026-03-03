/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import gaussianSplattingMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingMaterial.pure";

import { RegisterClass } from "../../Misc/typeStore";
import { GaussianSplattingMaterial } from "./gaussianSplattingMaterial.pure";

RegisterClass("BABYLON.GaussianSplattingMaterial", GaussianSplattingMaterial);
