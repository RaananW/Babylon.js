/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryCrossBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryCrossBlock.pure";

import { GeometryCrossBlock } from "./geometryCrossBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryCrossBlock", GeometryCrossBlock);
