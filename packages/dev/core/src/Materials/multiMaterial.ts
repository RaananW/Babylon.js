/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import multiMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./multiMaterial.pure";

import { MultiMaterial } from "./multiMaterial.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.MultiMaterial", MultiMaterial);
