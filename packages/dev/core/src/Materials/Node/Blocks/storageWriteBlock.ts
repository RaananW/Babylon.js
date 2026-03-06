/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import storageWriteBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./storageWriteBlock.pure";

import { StorageWriteBlock } from "./storageWriteBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.StorageWriteBlock", StorageWriteBlock);
