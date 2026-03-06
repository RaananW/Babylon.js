/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import textureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./textureBlock.pure";

import { TextureBlock } from "./textureBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.TextureBlock", TextureBlock);
