/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import blurPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./blurPostProcessBlock.pure";

import { NodeRenderGraphBlurPostProcessBlock } from "./blurPostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphBlurPostProcessBlock", NodeRenderGraphBlurPostProcessBlock);
