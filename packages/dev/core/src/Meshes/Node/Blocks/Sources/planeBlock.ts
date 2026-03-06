/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import planeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./planeBlock.pure";

import { PlaneBlock } from "./planeBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.PlaneBlock", PlaneBlock);
