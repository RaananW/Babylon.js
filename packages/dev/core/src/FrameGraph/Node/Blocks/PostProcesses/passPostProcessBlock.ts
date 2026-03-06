/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import passPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./passPostProcessBlock.pure";

import { NodeRenderGraphPassCubePostProcessBlock, NodeRenderGraphPassPostProcessBlock } from "./passPostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphPassPostProcessBlock", NodeRenderGraphPassPostProcessBlock);

RegisterClass("BABYLON.NodeRenderGraphPassCubePostProcessBlock", NodeRenderGraphPassCubePostProcessBlock);
