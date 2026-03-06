/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import pbrMetallicRoughnessMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pbrMetallicRoughnessMaterial.pure";

import { PBRMetallicRoughnessMaterial } from "./pbrMetallicRoughnessMaterial.pure";
import { RegisterClass } from "../../Misc/typeStore";

RegisterClass("BABYLON.PBRMetallicRoughnessMaterial", PBRMetallicRoughnessMaterial);
