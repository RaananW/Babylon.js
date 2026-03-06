/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import volumetricLightingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./volumetricLightingBlock.pure";

import { NodeRenderGraphVolumetricLightingBlock } from "./volumetricLightingBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphVolumetricLightingBlock", NodeRenderGraphVolumetricLightingBlock);
