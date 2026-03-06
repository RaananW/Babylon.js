/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import perturbNormalBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./perturbNormalBlock.pure";

import { PerturbNormalBlock } from "./perturbNormalBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.PerturbNormalBlock", PerturbNormalBlock);
