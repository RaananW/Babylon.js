/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import setNormalsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setNormalsBlock.pure";

import { SetNormalsBlock } from "./setNormalsBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.SetNormalsBlock", SetNormalsBlock);
