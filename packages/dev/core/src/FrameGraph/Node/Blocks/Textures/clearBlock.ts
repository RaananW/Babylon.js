/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import clearBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./clearBlock.pure";

import { NodeRenderGraphClearBlock } from "./clearBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphClearBlock", NodeRenderGraphClearBlock);
