/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import addBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./addBlock.pure";

import { AddBlock } from "./addBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.AddBlock", AddBlock);
