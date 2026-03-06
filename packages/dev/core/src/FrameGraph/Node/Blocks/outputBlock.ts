/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import outputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./outputBlock.pure";

import { NodeRenderGraphOutputBlock } from "./outputBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphOutputBlock", NodeRenderGraphOutputBlock);
