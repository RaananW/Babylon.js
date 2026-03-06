/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import pbrSpecularGlossinessMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pbrSpecularGlossinessMaterial.pure";

import { PBRSpecularGlossinessMaterial } from "./pbrSpecularGlossinessMaterial.pure";
import { RegisterClass } from "../../Misc/typeStore";

RegisterClass("BABYLON.PBRSpecularGlossinessMaterial", PBRSpecularGlossinessMaterial);
