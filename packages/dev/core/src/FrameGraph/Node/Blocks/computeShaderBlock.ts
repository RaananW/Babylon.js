/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import computeShaderBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./computeShaderBlock.pure";

import { NodeRenderGraphComputeShaderBlock } from "./computeShaderBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphComputeShaderBlock", NodeRenderGraphComputeShaderBlock);
