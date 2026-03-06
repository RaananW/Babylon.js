/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryOutputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryOutputBlock.pure";

import { GeometryOutputBlock } from "./geometryOutputBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryOutputBlock", GeometryOutputBlock);
