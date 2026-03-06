/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import instantiateOnVolumeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instantiateOnVolumeBlock.pure";

import { InstantiateOnVolumeBlock } from "./instantiateOnVolumeBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.InstantiateOnVolumeBlock", InstantiateOnVolumeBlock);
