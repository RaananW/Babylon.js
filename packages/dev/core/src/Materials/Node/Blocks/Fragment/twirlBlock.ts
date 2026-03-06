/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import twirlBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./twirlBlock.pure";

import { TwirlBlock } from "./twirlBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.TwirlBlock", TwirlBlock);
