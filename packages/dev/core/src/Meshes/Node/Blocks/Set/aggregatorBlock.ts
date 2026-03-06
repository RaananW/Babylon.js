/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import aggregatorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./aggregatorBlock.pure";

import { AggregatorBlock } from "./aggregatorBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.AggregatorBlock", AggregatorBlock);
