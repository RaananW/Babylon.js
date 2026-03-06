/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import meshShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./meshShapeBlock.pure";

import { MeshShapeBlock } from "./meshShapeBlock.pure";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass("BABYLON.MeshShapeBlock", MeshShapeBlock);
