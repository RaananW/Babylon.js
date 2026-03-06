/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import backgroundMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./backgroundMaterial.pure";

import { BackgroundMaterial } from "./backgroundMaterial.pure";
import { RegisterClass } from "../../Misc/typeStore";

RegisterClass("BABYLON.BackgroundMaterial", BackgroundMaterial);
