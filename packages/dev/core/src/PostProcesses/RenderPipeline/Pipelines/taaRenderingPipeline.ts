/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import taaRenderingPipeline.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./taaRenderingPipeline.pure";

import { TAARenderingPipeline } from "./taaRenderingPipeline.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.TAARenderingPipeline", TAARenderingPipeline);
