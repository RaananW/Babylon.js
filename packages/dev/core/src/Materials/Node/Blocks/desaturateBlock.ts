/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import desaturateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./desaturateBlock.pure";

import { DesaturateBlock } from "./desaturateBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.DesaturateBlock", DesaturateBlock);
