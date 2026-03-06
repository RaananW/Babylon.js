/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import chromaticAberrationPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./chromaticAberrationPostProcessBlock.pure";

import { NodeRenderGraphChromaticAberrationPostProcessBlock } from "./chromaticAberrationPostProcessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.NodeRenderGraphChromaticAberrationPostProcessBlock", NodeRenderGraphChromaticAberrationPostProcessBlock);
