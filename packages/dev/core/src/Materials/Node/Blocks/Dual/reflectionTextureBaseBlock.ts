/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import reflectionTextureBaseBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./reflectionTextureBaseBlock.pure";

import { ReflectionTextureBaseBlock } from "./reflectionTextureBaseBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.ReflectionTextureBaseBlock", ReflectionTextureBaseBlock);
