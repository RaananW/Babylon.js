/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryEaseBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryEaseBlock.pure";

import { GeometryEaseBlock } from "./geometryEaseBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryEaseBlock", GeometryEaseBlock);
