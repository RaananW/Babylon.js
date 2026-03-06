/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import bonesBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./bonesBlock.pure";

import { BonesBlock } from "./bonesBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.BonesBlock", BonesBlock);
