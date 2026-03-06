/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import generateMipmapsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./generateMipmapsBlock.pure";

import { NodeRenderGraphGenerateMipmapsBlock } from "./generateMipmapsBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphGenerateMipmapsBlock", NodeRenderGraphGenerateMipmapsBlock);
