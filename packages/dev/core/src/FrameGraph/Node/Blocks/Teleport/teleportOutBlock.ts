/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import teleportOutBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./teleportOutBlock.pure";

import { NodeRenderGraphTeleportOutBlock } from "./teleportOutBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphTeleportOutBlock", NodeRenderGraphTeleportOutBlock);
