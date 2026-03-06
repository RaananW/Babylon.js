/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import colorCorrectionPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./colorCorrectionPostProcessBlock.pure";

import { NodeRenderGraphColorCorrectionPostProcessBlock } from "./colorCorrectionPostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphColorCorrectionPostProcessBlock", NodeRenderGraphColorCorrectionPostProcessBlock);
