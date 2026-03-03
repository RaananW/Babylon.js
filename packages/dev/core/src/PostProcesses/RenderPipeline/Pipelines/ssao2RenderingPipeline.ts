/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import ssao2RenderingPipeline.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ssao2RenderingPipeline.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { SSAO2RenderingPipeline } from "./ssao2RenderingPipeline.pure";

RegisterClass("BABYLON.SSAO2RenderingPipeline", SSAO2RenderingPipeline);
