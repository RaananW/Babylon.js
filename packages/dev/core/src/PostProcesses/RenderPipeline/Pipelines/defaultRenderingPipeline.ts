/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import defaultRenderingPipeline.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./defaultRenderingPipeline.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { DefaultRenderingPipeline } from "./defaultRenderingPipeline.pure";

RegisterClass("BABYLON.DefaultRenderingPipeline", DefaultRenderingPipeline);
