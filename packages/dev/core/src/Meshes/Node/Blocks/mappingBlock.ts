/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import mappingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./mappingBlock.pure";

import { MappingBlock } from "./mappingBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.MappingBlock", MappingBlock);
