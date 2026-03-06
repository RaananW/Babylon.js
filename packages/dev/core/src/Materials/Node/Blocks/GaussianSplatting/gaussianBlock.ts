/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianBlock.pure";

import { GaussianBlock } from "./gaussianBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.GaussianBlock", GaussianBlock);
