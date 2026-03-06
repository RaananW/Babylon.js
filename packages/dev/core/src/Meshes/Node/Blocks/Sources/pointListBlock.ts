/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import pointListBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pointListBlock.pure";

import { PointListBlock } from "./pointListBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.PointListBlock", PointListBlock);
