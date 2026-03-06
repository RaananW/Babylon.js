/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import motionBlurPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./motionBlurPostProcessBlock.pure";

import { NodeRenderGraphMotionBlurPostProcessBlock } from "./motionBlurPostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphMotionBlurPostProcessBlock", NodeRenderGraphMotionBlurPostProcessBlock);
