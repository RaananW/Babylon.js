/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import debugBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./debugBlock.pure";

import { DebugBlock } from "./debugBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.DebugBlock", DebugBlock);
