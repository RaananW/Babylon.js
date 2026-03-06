/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import refractBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./refractBlock.pure";

import { RefractBlock } from "./refractBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.RefractBlock", RefractBlock);
