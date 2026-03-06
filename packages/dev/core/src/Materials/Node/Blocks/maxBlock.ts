/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import maxBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./maxBlock.pure";

import { MaxBlock } from "./maxBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.MaxBlock", MaxBlock);
