/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import lightingVolumeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./lightingVolumeBlock.pure";

import { NodeRenderGraphLightingVolumeBlock } from "./lightingVolumeBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphLightingVolumeBlock", NodeRenderGraphLightingVolumeBlock);
