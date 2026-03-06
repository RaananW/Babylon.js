/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryTransformBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryTransformBlock.pure";

import { GeometryTransformBlock } from "./geometryTransformBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryTransformBlock", GeometryTransformBlock);
