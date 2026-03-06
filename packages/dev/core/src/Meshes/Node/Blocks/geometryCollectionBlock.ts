/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryCollectionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryCollectionBlock.pure";

import { GeometryCollectionBlock } from "./geometryCollectionBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryCollectionBlock", GeometryCollectionBlock);
