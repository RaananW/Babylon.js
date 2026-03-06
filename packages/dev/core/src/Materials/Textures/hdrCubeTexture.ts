/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import hdrCubeTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./hdrCubeTexture.pure";

import { HDRCubeTexture } from "./hdrCubeTexture.pure";
import { RegisterClass } from "../../Misc/typeStore";

RegisterClass("BABYLON.HDRCubeTexture", HDRCubeTexture);
