/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import triPlanarBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./triPlanarBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { TriPlanarBlock } from "./triPlanarBlock.pure";

RegisterClass("BABYLON.TriPlanarBlock", TriPlanarBlock);
