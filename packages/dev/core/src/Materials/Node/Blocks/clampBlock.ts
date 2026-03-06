/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import clampBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./clampBlock.pure";

import { ClampBlock } from "./clampBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ClampBlock", ClampBlock);
