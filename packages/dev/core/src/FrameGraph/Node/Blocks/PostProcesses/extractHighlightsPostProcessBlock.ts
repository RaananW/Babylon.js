/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import extractHighlightsPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./extractHighlightsPostProcessBlock.pure";

import { NodeRenderGraphExtractHighlightsPostProcessBlock } from "./extractHighlightsPostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphExtractHighlightsPostProcessBlock", NodeRenderGraphExtractHighlightsPostProcessBlock);
