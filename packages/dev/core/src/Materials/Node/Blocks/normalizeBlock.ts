/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import normalizeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./normalizeBlock.pure";

import { NormalizeBlock } from "./normalizeBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.NormalizeBlock", NormalizeBlock);
