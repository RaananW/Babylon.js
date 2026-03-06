/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import customBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./customBlock.pure";

import { CustomBlock } from "./customBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.CustomBlock", CustomBlock);
