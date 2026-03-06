/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import shadowGeneratorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./shadowGeneratorBlock.pure";

import { NodeRenderGraphShadowGeneratorBlock } from "./shadowGeneratorBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphShadowGeneratorBlock", NodeRenderGraphShadowGeneratorBlock);
