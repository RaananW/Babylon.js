/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import taaRenderingPipeline.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./taaRenderingPipeline.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { TAARenderingPipeline } from "./taaRenderingPipeline.pure";

RegisterClass("BABYLON.TAARenderingPipeline", TAARenderingPipeline);
