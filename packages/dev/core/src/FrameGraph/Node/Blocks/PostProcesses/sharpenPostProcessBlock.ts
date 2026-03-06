/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import sharpenPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sharpenPostProcessBlock.pure";

import { NodeRenderGraphSharpenPostProcessBlock } from "./sharpenPostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphSharpenPostProcessBlock", NodeRenderGraphSharpenPostProcessBlock);
