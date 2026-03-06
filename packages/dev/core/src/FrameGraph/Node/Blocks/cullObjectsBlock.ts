/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import cullObjectsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cullObjectsBlock.pure";

import { NodeRenderGraphCullObjectsBlock } from "./cullObjectsBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphCullObjectsBlock", NodeRenderGraphCullObjectsBlock);
