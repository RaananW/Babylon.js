/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import posterizeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./posterizeBlock.pure";

import { PosterizeBlock } from "./posterizeBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.PosterizeBlock", PosterizeBlock);
