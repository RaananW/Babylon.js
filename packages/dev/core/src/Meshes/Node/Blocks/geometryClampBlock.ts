/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryClampBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryClampBlock.pure";

import { GeometryClampBlock } from "./geometryClampBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryClampBlock", GeometryClampBlock);
