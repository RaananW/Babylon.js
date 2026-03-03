/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import randomNumberBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./randomNumberBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { RandomNumberBlock } from "./randomNumberBlock.pure";

RegisterClass("BABYLON.RandomNumberBlock", RandomNumberBlock);
