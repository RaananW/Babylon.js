/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import screenSizeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./screenSizeBlock.pure";

import { ScreenSizeBlock } from "./screenSizeBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.ScreenSizeBlock", ScreenSizeBlock);
