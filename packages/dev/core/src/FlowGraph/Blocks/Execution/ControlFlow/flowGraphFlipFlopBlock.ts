/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphFlipFlopBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphFlipFlopBlock.pure";

import { FlowGraphFlipFlopBlock } from "./flowGraphFlipFlopBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.FlipFlop, FlowGraphFlipFlopBlock);
