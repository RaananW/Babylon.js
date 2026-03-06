/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import depthOfFieldPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./depthOfFieldPostProcessBlock.pure";

import { NodeRenderGraphDepthOfFieldPostProcessBlock } from "./depthOfFieldPostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphDepthOfFieldPostProcessBlock", NodeRenderGraphDepthOfFieldPostProcessBlock);
