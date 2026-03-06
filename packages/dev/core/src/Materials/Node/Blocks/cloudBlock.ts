/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import cloudBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cloudBlock.pure";

import { CloudBlock } from "./cloudBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.CloudBlock", CloudBlock);
