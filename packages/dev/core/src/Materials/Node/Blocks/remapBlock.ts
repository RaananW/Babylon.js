/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import remapBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./remapBlock.pure";

import { RemapBlock } from "./remapBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.RemapBlock", RemapBlock);
