/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import setMaterialIDBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setMaterialIDBlock.pure";

import { SetMaterialIDBlock } from "./setMaterialIDBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.SetMaterialIDBlock", SetMaterialIDBlock);
