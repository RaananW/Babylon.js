/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import anisotropyBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./anisotropyBlock.pure";

import { AnisotropyBlock } from "./anisotropyBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.AnisotropyBlock", AnisotropyBlock);
