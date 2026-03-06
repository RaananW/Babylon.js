/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import nullBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./nullBlock.pure";

import { NullBlock } from "./nullBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NullBlock", NullBlock);
