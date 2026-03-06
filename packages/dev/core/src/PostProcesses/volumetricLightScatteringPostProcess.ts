/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import volumetricLightScatteringPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./volumetricLightScatteringPostProcess.pure";

import { VolumetricLightScatteringPostProcess } from "./volumetricLightScatteringPostProcess.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.VolumetricLightScatteringPostProcess", VolumetricLightScatteringPostProcess);
