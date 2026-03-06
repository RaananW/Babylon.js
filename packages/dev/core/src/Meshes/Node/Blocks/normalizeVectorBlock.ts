/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import normalizeVectorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./normalizeVectorBlock.pure";

import { NormalizeVectorBlock } from "./normalizeVectorBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.NormalizeVectorBlock", NormalizeVectorBlock);
