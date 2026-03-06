/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import anaglyphPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./anaglyphPostProcessBlock.pure";

import { NodeRenderGraphAnaglyphPostProcessBlock } from "./anaglyphPostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphAnaglyphPostProcessBlock", NodeRenderGraphAnaglyphPostProcessBlock);
