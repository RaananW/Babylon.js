/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fragCoordBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fragCoordBlock.pure";

import { FragCoordBlock } from "./fragCoordBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.FragCoordBlock", FragCoordBlock);
