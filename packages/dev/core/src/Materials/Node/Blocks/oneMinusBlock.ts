/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import oneMinusBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./oneMinusBlock.pure";

import { OneMinusBlock } from "./oneMinusBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.OneMinusBlock", OneMinusBlock);

RegisterClass("BABYLON.OppositeBlock", OneMinusBlock);
