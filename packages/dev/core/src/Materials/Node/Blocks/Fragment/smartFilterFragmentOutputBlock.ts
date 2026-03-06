/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import smartFilterFragmentOutputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./smartFilterFragmentOutputBlock.pure";

import { SmartFilterFragmentOutputBlock } from "./smartFilterFragmentOutputBlock.pure";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass("BABYLON.SmartFilterFragmentOutputBlock", SmartFilterFragmentOutputBlock);
