/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import ssao2PostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ssao2PostProcessBlock.pure";

import { NodeRenderGraphSSAO2PostProcessBlock } from "./ssao2PostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphSSAO2PostProcessBlock", NodeRenderGraphSSAO2PostProcessBlock);
