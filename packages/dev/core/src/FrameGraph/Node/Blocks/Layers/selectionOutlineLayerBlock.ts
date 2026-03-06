/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import selectionOutlineLayerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./selectionOutlineLayerBlock.pure";

import { NodeRenderGraphSelectionOutlineLayerBlock } from "./selectionOutlineLayerBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphSelectionOutlineLayerBlock", NodeRenderGraphSelectionOutlineLayerBlock);
