/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import systemBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./systemBlock.pure";

import { SystemBlock } from "./systemBlock.pure";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass("BABYLON.SystemBlock", SystemBlock);
