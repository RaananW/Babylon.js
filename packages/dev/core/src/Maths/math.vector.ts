/**
 * Re-exports all pure math.vector types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import math.vector.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./math.vector.pure";

import { RegisterClass } from "../Misc/typeStore";
import { Vector2, Vector3, Vector4, Matrix } from "./math.vector.pure";

RegisterClass("BABYLON.Vector2", Vector2);
RegisterClass("BABYLON.Vector3", Vector3);
RegisterClass("BABYLON.Vector4", Vector4);
RegisterClass("BABYLON.Matrix", Matrix);
