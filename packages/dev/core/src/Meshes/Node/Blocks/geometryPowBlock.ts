/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryPowBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryPowBlock.pure";

import { GeometryPowBlock } from "./geometryPowBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryPowBlock", GeometryPowBlock);
