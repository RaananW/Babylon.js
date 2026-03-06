/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fogBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fogBlock.pure";

import { FogBlock } from "./fogBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.FogBlock", FogBlock);
