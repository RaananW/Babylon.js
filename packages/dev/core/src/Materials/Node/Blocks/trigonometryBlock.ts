/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import trigonometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./trigonometryBlock.pure";

import { TrigonometryBlock } from "./trigonometryBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.TrigonometryBlock", TrigonometryBlock);
