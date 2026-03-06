/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import taaMaterialManager.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./taaMaterialManager.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { TAAJitterMaterialPlugin } from "./taaMaterialManager.pure";

RegisterClass(`BABYLON.TAAJitterMaterialPlugin`, TAAJitterMaterialPlugin);
