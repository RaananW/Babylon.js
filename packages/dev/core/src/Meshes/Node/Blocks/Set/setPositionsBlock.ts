/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import setPositionsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setPositionsBlock.pure";

import { SetPositionsBlock } from "./setPositionsBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.SetPositionsBlock", SetPositionsBlock);
