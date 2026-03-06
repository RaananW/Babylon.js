/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import standardRenderingPipeline.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./standardRenderingPipeline.pure";

import { StandardRenderingPipeline } from "./standardRenderingPipeline.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.StandardRenderingPipeline", StandardRenderingPipeline);
