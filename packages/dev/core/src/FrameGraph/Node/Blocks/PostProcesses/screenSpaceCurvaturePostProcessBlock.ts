/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import screenSpaceCurvaturePostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./screenSpaceCurvaturePostProcessBlock.pure";

import { NodeRenderGraphScreenSpaceCurvaturePostProcessBlock } from "./screenSpaceCurvaturePostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphScreenSpaceCurvaturePostProcessBlock", NodeRenderGraphScreenSpaceCurvaturePostProcessBlock);
