/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import utilityLayerRendererBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./utilityLayerRendererBlock.pure";

import { NodeRenderGraphUtilityLayerRendererBlock } from "./utilityLayerRendererBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphUtilityLayerRendererBlock", NodeRenderGraphUtilityLayerRendererBlock);
