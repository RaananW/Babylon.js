/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import reciprocalBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./reciprocalBlock.pure";

import { ReciprocalBlock } from "./reciprocalBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ReciprocalBlock", ReciprocalBlock);
