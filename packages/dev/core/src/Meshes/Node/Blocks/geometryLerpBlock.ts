/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryLerpBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryLerpBlock.pure";

import { GeometryLerpBlock } from "./geometryLerpBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryLerpBlock", GeometryLerpBlock);
