/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryDesaturateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryDesaturateBlock.pure";

import { GeometryDesaturateBlock } from "./geometryDesaturateBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryDesaturateBlock", GeometryDesaturateBlock);
