/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import blackAndWhitePostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./blackAndWhitePostProcessBlock.pure";

import { NodeRenderGraphBlackAndWhitePostProcessBlock } from "./blackAndWhitePostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphBlackAndWhitePostProcessBlock", NodeRenderGraphBlackAndWhitePostProcessBlock);
