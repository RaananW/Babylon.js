/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import subdivideBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./subdivideBlock.pure";

import { SubdivideBlock } from "./subdivideBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.SubdivideBlock", SubdivideBlock);
