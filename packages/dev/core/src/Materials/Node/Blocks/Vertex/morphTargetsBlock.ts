/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import morphTargetsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./morphTargetsBlock.pure";

import { MorphTargetsBlock } from "./morphTargetsBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.MorphTargetsBlock", MorphTargetsBlock);
