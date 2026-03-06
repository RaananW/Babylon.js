/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import freeCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./freeCamera.pure";

import { FreeCamera } from "./freeCamera.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.FreeCamera", FreeCamera);
