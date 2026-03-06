/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import subtractBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./subtractBlock.pure";

import { SubtractBlock } from "./subtractBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.SubtractBlock", SubtractBlock);
