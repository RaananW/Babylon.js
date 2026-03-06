/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryRendererBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryRendererBlock.pure";

import { NodeRenderGraphGeometryRendererBlock } from "./geometryRendererBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphGeometryRendererBlock", NodeRenderGraphGeometryRendererBlock);
