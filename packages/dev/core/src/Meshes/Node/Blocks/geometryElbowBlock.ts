/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryElbowBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryElbowBlock.pure";

import { GeometryElbowBlock } from "./geometryElbowBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryElbowBlock", GeometryElbowBlock);
