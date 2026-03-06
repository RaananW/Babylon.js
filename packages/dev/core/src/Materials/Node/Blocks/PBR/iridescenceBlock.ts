/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import iridescenceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./iridescenceBlock.pure";

import { IridescenceBlock } from "./iridescenceBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.IridescenceBlock", IridescenceBlock);
