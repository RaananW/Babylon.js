/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import sceneDepthBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sceneDepthBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { SceneDepthBlock } from "./sceneDepthBlock.pure";

RegisterClass("BABYLON.SceneDepthBlock", SceneDepthBlock);
