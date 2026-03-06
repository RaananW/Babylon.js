/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import screenSpaceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./screenSpaceBlock.pure";

import { ScreenSpaceBlock } from "./screenSpaceBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.ScreenSpaceBlock", ScreenSpaceBlock);
