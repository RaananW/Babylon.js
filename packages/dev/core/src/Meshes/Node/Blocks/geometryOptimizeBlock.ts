/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryOptimizeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryOptimizeBlock.pure";

import { GeometryOptimizeBlock } from "./geometryOptimizeBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryOptimizeBlock", GeometryOptimizeBlock);
