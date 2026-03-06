/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryNLerpBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryNLerpBlock.pure";

import { GeometryNLerpBlock } from "./geometryNLerpBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryNLerpBlock", GeometryNLerpBlock);
