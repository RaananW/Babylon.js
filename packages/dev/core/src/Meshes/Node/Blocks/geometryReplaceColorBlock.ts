/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryReplaceColorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryReplaceColorBlock.pure";

import { GeometryReplaceColorBlock } from "./geometryReplaceColorBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryReplaceColorBlock", GeometryReplaceColorBlock);
