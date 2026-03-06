/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import circleOfConfusionPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./circleOfConfusionPostProcessBlock.pure";

import { NodeRenderGraphCircleOfConfusionPostProcessBlock } from "./circleOfConfusionPostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphCircleOfConfusionPostProcessBlock", NodeRenderGraphCircleOfConfusionPostProcessBlock);
