/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import alignBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./alignBlock.pure";

import { AlignBlock } from "./alignBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.AlignBlock", AlignBlock);
