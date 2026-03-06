/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import vertexOutputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./vertexOutputBlock.pure";

import { VertexOutputBlock } from "./vertexOutputBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.VertexOutputBlock", VertexOutputBlock);
