/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import pbrMetallicRoughnessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pbrMetallicRoughnessBlock.pure";

import { PBRMetallicRoughnessBlock } from "./pbrMetallicRoughnessBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.PBRMetallicRoughnessBlock", PBRMetallicRoughnessBlock);
