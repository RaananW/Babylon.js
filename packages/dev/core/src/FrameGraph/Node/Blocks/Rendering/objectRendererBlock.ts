/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import objectRendererBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./objectRendererBlock.pure";

import { NodeRenderGraphObjectRendererBlock } from "./objectRendererBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphObjectRendererBlock", NodeRenderGraphObjectRendererBlock);
