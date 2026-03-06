/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import instantiateOnVerticesBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instantiateOnVerticesBlock.pure";

import { InstantiateOnVerticesBlock } from "./instantiateOnVerticesBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.InstantiateOnVerticesBlock", InstantiateOnVerticesBlock);
