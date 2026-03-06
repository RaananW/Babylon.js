/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateDirectionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateDirectionBlock.pure";

import { UpdateDirectionBlock } from "./updateDirectionBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.UpdateDirectionBlock", UpdateDirectionBlock);
