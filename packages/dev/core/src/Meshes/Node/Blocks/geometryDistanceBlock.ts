/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryDistanceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryDistanceBlock.pure";

import { GeometryDistanceBlock } from "./geometryDistanceBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryDistanceBlock", GeometryDistanceBlock);
