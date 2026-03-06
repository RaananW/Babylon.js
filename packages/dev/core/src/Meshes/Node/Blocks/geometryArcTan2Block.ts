/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryArcTan2Block.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryArcTan2Block.pure";

import { GeometryArcTan2Block } from "./geometryArcTan2Block.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryArcTan2Block", GeometryArcTan2Block);
