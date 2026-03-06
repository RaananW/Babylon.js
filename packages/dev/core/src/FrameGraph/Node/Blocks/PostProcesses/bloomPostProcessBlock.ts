/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import bloomPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./bloomPostProcessBlock.pure";

import { NodeRenderGraphBloomPostProcessBlock } from "./bloomPostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphBloomPostProcessBlock", NodeRenderGraphBloomPostProcessBlock);
