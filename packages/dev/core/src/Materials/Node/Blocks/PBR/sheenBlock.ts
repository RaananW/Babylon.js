/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import sheenBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sheenBlock.pure";

import { SheenBlock } from "./sheenBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.SheenBlock", SheenBlock);
