/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryTextureFetchBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryTextureFetchBlock.pure";

import { GeometryTextureFetchBlock } from "./geometryTextureFetchBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryTextureFetchBlock", GeometryTextureFetchBlock);
