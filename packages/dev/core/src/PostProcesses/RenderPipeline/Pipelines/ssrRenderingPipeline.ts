/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import ssrRenderingPipeline.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ssrRenderingPipeline.pure";

import { SSRRenderingPipeline } from "./ssrRenderingPipeline.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.SSRRenderingPipeline", SSRRenderingPipeline);
