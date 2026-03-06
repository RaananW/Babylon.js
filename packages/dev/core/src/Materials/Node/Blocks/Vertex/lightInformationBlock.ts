/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import lightInformationBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./lightInformationBlock.pure";

import { LightInformationBlock } from "./lightInformationBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.LightInformationBlock", LightInformationBlock);
