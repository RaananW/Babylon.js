/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import alignAngleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./alignAngleBlock.pure";

import { AlignAngleBlock } from "./alignAngleBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.AlignAngleBlock", AlignAngleBlock);
