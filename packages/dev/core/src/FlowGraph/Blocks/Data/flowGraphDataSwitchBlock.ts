/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphDataSwitchBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphDataSwitchBlock.pure";

import { FlowGraphDataSwitchBlock } from "./flowGraphDataSwitchBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.DataSwitch, FlowGraphDataSwitchBlock);
