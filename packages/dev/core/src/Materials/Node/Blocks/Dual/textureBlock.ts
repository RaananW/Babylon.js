/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import textureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./textureBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { TextureBlock } from "./textureBlock.pure";

RegisterClass("BABYLON.TextureBlock", TextureBlock);
