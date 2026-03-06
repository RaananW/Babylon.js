/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryTrigonometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryTrigonometryBlock.pure";

import { GeometryTrigonometryBlock } from "./geometryTrigonometryBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryTrigonometryBlock", GeometryTrigonometryBlock);
