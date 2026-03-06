/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import distanceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./distanceBlock.pure";

import { DistanceBlock } from "./distanceBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.DistanceBlock", DistanceBlock);
