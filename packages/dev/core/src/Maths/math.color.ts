/**
 * Re-exports all pure math.color types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import math.color.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./math.color.pure";

import { RegisterClass } from "../Misc/typeStore";
import { Color3, Color4 } from "./math.color.pure";

RegisterClass("BABYLON.Color3", Color3);
RegisterClass("BABYLON.Color4", Color4);
