/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import meshDebugPluginMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./meshDebugPluginMaterial.pure";

import { MeshDebugPluginMaterial } from "./meshDebugPluginMaterial.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.MeshDebugPluginMaterial", MeshDebugPluginMaterial);
