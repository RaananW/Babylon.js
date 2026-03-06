/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import cleanGeometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cleanGeometryBlock.pure";

import { CleanGeometryBlock } from "./cleanGeometryBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.CleanGeometryBlock", CleanGeometryBlock);
