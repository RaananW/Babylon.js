/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryInputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryInputBlock.pure";

import { GeometryInputBlock } from "./geometryInputBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryInputBlock", GeometryInputBlock);
