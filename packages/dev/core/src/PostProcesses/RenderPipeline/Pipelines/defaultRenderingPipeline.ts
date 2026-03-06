/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import defaultRenderingPipeline.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./defaultRenderingPipeline.pure";

import { DefaultRenderingPipeline } from "./defaultRenderingPipeline.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.DefaultRenderingPipeline", DefaultRenderingPipeline);
