/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import inputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./inputBlock.pure";

import { NodeRenderGraphInputBlock } from "./inputBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphInputBlock", NodeRenderGraphInputBlock);
