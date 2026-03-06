/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import materialPluginBase.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./materialPluginBase.pure";

import { MaterialPluginBase } from "./materialPluginBase.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.MaterialPluginBase", MaterialPluginBase);
