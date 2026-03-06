/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import instantiateOnFacesBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instantiateOnFacesBlock.pure";

import { InstantiateOnFacesBlock } from "./instantiateOnFacesBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.InstantiateOnFacesBlock", InstantiateOnFacesBlock);
