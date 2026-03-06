/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryDotBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryDotBlock.pure";

import { GeometryDotBlock } from "./geometryDotBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryDotBlock", GeometryDotBlock);
