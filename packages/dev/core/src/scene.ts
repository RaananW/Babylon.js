/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import scene.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./scene.pure";

import { Scene } from "./scene.pure";
import { RegisterClass } from "./Misc/typeStore";

RegisterClass("BABYLON.Scene", Scene);
