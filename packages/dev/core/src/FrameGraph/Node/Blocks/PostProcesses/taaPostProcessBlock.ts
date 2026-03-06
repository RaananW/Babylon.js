/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import taaPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./taaPostProcessBlock.pure";

import { NodeRenderGraphTAAPostProcessBlock } from "./taaPostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphTAAPostProcessBlock", NodeRenderGraphTAAPostProcessBlock);
