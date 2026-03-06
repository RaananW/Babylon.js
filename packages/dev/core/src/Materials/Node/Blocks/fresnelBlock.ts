/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fresnelBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fresnelBlock.pure";

import { FresnelBlock } from "./fresnelBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.FresnelBlock", FresnelBlock);
