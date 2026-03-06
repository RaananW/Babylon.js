/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphMultiGateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphMultiGateBlock.pure";

import { FlowGraphMultiGateBlock } from "./flowGraphMultiGateBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.MultiGate, FlowGraphMultiGateBlock);
