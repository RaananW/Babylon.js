/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import storageReadBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./storageReadBlock.pure";

import { StorageReadBlock } from "./storageReadBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.StorageReadBlock", StorageReadBlock);
