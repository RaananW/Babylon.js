/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import stepBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./stepBlock.pure";

import { StepBlock } from "./stepBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.StepBlock", StepBlock);
