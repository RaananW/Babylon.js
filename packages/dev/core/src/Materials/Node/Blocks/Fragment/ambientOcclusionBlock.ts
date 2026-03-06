/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import ambientOcclusionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ambientOcclusionBlock.pure";

import { AmbientOcclusionBlock } from "./ambientOcclusionBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.AmbientOcclusionBlock", AmbientOcclusionBlock);
