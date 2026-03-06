/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import resourceContainerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./resourceContainerBlock.pure";

import { NodeRenderGraphResourceContainerBlock } from "./resourceContainerBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphResourceContainerBlock", NodeRenderGraphResourceContainerBlock);
