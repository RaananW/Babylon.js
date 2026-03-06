/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fxaaPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fxaaPostProcessBlock.pure";

import { NodeRenderGraphFXAAPostProcessBlock } from "./fxaaPostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphFXAAPostProcessBlock", NodeRenderGraphFXAAPostProcessBlock);
