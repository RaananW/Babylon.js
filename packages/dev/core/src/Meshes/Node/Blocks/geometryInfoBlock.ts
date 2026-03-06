/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryInfoBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryInfoBlock.pure";

import { GeometryInfoBlock } from "./geometryInfoBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryInfoBlock", GeometryInfoBlock);
