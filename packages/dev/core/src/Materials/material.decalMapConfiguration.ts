/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import material.decalMapConfiguration.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./material.decalMapConfiguration.pure";

import { DecalMapConfiguration } from "./material.decalMapConfiguration.pure";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass("BABYLON.DecalMapConfiguration", DecalMapConfiguration);
