/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import instantiateRadialBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instantiateRadialBlock.pure";

import { InstantiateRadialBlock } from "./instantiateRadialBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.InstantiateRadialBlock", InstantiateRadialBlock);
