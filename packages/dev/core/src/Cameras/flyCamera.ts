/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flyCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flyCamera.pure";

import { FlyCamera } from "./flyCamera.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.FlyCamera", FlyCamera);
