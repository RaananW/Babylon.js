/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import currentScreenBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./currentScreenBlock.pure";

import { CurrentScreenBlock } from "./currentScreenBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.CurrentScreenBlock", CurrentScreenBlock);
