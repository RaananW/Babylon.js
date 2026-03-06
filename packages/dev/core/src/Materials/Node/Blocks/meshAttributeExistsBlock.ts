/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import meshAttributeExistsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./meshAttributeExistsBlock.pure";

import { MeshAttributeExistsBlock } from "./meshAttributeExistsBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.MeshAttributeExistsBlock", MeshAttributeExistsBlock);
