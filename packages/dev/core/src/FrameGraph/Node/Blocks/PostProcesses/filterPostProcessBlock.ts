/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import filterPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./filterPostProcessBlock.pure";

import { NodeRenderGraphFilterPostProcessBlock } from "./filterPostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphFilterPostProcessBlock", NodeRenderGraphFilterPostProcessBlock);
