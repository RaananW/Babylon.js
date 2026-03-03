/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import hdrCubeTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./hdrCubeTexture.pure";

import { RegisterClass } from "../../Misc/typeStore";
import { HDRCubeTexture } from "./hdrCubeTexture.pure";

RegisterClass("BABYLON.HDRCubeTexture", HDRCubeTexture);
