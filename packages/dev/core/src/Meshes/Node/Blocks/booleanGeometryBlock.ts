/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import booleanGeometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./booleanGeometryBlock.pure";

import { BooleanGeometryBlock } from "./booleanGeometryBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.BooleanGeometryBlock", BooleanGeometryBlock);
