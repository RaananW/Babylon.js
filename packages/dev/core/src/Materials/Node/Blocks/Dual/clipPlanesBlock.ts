/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import clipPlanesBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./clipPlanesBlock.pure";

import { ClipPlanesBlock } from "./clipPlanesBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.ClipPlanesBlock", ClipPlanesBlock);
