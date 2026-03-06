/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import mergeGeometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./mergeGeometryBlock.pure";

import { MergeGeometryBlock } from "./mergeGeometryBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.MergeGeometryBlock", MergeGeometryBlock);
