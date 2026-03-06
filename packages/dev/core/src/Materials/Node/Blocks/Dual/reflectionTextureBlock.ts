/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import reflectionTextureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./reflectionTextureBlock.pure";

import { ReflectionTextureBlock } from "./reflectionTextureBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.ReflectionTextureBlock", ReflectionTextureBlock);
