/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import highlightLayerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./highlightLayerBlock.pure";

import { NodeRenderGraphHighlightLayerBlock } from "./highlightLayerBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphHighlightLayerBlock", NodeRenderGraphHighlightLayerBlock);
