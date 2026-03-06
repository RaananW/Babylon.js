/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import arcTan2Block.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./arcTan2Block.pure";

import { ArcTan2Block } from "./arcTan2Block.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.ArcTan2Block", ArcTan2Block);
