/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import exrCubeTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./exrCubeTexture.pure";

import { EXRCubeTexture } from "./exrCubeTexture.pure";
import { RegisterClass } from "../../Misc/typeStore";

RegisterClass("BABYLON.EXRCubeTexture", EXRCubeTexture);
