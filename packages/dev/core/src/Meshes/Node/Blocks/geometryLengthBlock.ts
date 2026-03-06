/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryLengthBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryLengthBlock.pure";

import { GeometryLengthBlock } from "./geometryLengthBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryLengthBlock", GeometryLengthBlock);
