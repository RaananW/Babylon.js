/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import exrCubeTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./exrCubeTexture.pure";

import { RegisterClass } from "../../Misc/typeStore";
import { EXRCubeTexture } from "./exrCubeTexture.pure";

RegisterClass("BABYLON.EXRCubeTexture", EXRCubeTexture);
