/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import giRSMManager.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./giRSMManager.pure";

import { GIRSMRenderPluginMaterial } from "./giRSMManager.pure";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(`BABYLON.GIRSMRenderPluginMaterial`, GIRSMRenderPluginMaterial);
