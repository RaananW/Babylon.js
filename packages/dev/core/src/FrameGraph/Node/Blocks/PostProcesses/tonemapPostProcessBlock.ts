/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import tonemapPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./tonemapPostProcessBlock.pure";

import { NodeRenderGraphTonemapPostProcessBlock } from "./tonemapPostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphTonemapPostProcessBlock", NodeRenderGraphTonemapPostProcessBlock);
