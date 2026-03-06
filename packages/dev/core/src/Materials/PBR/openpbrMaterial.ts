/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import openpbrMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./openpbrMaterial.pure";

import { OpenPBRMaterial } from "./openpbrMaterial.pure";
import { RegisterClass } from "../../Misc/typeStore";

RegisterClass("BABYLON.OpenPBRMaterial", OpenPBRMaterial);
