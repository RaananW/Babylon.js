/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import instantiateLinearBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instantiateLinearBlock.pure";

import { InstantiateLinearBlock } from "./instantiateLinearBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.InstantiateLinearBlock", InstantiateLinearBlock);
