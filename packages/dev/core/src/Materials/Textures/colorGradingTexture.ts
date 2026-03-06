/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import colorGradingTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./colorGradingTexture.pure";

import { ColorGradingTexture } from "./colorGradingTexture.pure";
import { RegisterClass } from "../../Misc/typeStore";

RegisterClass("BABYLON.ColorGradingTexture", ColorGradingTexture);
