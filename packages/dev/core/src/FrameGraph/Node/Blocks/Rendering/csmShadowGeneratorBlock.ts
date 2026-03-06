/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import csmShadowGeneratorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./csmShadowGeneratorBlock.pure";

import { NodeRenderGraphCascadedShadowGeneratorBlock } from "./csmShadowGeneratorBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphCascadedShadowGeneratorBlock", NodeRenderGraphCascadedShadowGeneratorBlock);
