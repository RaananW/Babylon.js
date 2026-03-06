/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import imageProcessingPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./imageProcessingPostProcessBlock.pure";

import { NodeRenderGraphImageProcessingPostProcessBlock } from "./imageProcessingPostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphImageProcessingPostProcessBlock", NodeRenderGraphImageProcessingPostProcessBlock);
