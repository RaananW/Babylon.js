/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import reflectBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./reflectBlock.pure";

import { ReflectBlock } from "./reflectBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ReflectBlock", ReflectBlock);
