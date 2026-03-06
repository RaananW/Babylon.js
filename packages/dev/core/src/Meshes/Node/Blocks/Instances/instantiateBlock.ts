/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import instantiateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instantiateBlock.pure";

import { InstantiateBlock } from "./instantiateBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.InstantiateBlock", InstantiateBlock);
