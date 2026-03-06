/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import modBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./modBlock.pure";

import { ModBlock } from "./modBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ModBlock", ModBlock);
