/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import latticeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./latticeBlock.pure";

import { LatticeBlock } from "./latticeBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.LatticeBlock", LatticeBlock);
