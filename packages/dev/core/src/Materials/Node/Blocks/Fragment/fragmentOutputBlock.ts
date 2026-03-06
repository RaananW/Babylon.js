/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fragmentOutputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fragmentOutputBlock.pure";

import { FragmentOutputBlock } from "./fragmentOutputBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.FragmentOutputBlock", FragmentOutputBlock);
