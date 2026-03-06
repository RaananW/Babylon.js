/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import pannerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pannerBlock.pure";

import { PannerBlock } from "./pannerBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.PannerBlock", PannerBlock);
