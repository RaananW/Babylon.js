/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import grainPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./grainPostProcessBlock.pure";

import { NodeRenderGraphGrainPostProcessBlock } from "./grainPostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphGrainPostProcessBlock", NodeRenderGraphGrainPostProcessBlock);
