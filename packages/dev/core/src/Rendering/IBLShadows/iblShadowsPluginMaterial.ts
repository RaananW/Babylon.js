/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import iblShadowsPluginMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./iblShadowsPluginMaterial.pure";

import { RegisterClass } from "core/Misc/typeStore";


RegisterClass(`BABYLON.IBLShadowsPluginMaterial`, IBLShadowsPluginMaterial);
