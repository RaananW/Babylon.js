/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import frontFacingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./frontFacingBlock.pure";

import { FrontFacingBlock } from "./frontFacingBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.FrontFacingBlock", FrontFacingBlock);
