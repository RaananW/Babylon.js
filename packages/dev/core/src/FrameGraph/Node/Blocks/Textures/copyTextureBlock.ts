/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import copyTextureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./copyTextureBlock.pure";

import { NodeRenderGraphCopyTextureBlock } from "./copyTextureBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphCopyTextureBlock", NodeRenderGraphCopyTextureBlock);
