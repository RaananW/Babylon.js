/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import ssrRenderingPipeline.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ssrRenderingPipeline.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { SSRRenderingPipeline } from "./ssrRenderingPipeline.pure";

RegisterClass("BABYLON.SSRRenderingPipeline", SSRRenderingPipeline);
