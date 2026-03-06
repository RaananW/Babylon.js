/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import normalBlendBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./normalBlendBlock.pure";

import { NormalBlendBlock } from "./normalBlendBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.NormalBlendBlock", NormalBlendBlock);
