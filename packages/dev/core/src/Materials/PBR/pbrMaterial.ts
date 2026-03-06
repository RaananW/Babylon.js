/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import pbrMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pbrMaterial.pure";

import { PBRMaterial } from "./pbrMaterial.pure";
import { RegisterClass } from "../../Misc/typeStore";

RegisterClass("BABYLON.PBRMaterial", PBRMaterial);
