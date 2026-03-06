/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import ssrPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ssrPostProcessBlock.pure";

import { NodeRenderGraphSSRPostProcessBlock } from "./ssrPostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphSSRPostProcessBlock", NodeRenderGraphSSRPostProcessBlock);
