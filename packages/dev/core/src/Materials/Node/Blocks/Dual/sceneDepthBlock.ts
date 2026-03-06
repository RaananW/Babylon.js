/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import sceneDepthBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sceneDepthBlock.pure";

import { SceneDepthBlock } from "./sceneDepthBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.SceneDepthBlock", SceneDepthBlock);
