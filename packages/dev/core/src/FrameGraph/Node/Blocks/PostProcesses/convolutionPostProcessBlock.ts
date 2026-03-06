/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import convolutionPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./convolutionPostProcessBlock.pure";

import { NodeRenderGraphConvolutionPostProcessBlock } from "./convolutionPostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphConvolutionPostProcessBlock", NodeRenderGraphConvolutionPostProcessBlock);
