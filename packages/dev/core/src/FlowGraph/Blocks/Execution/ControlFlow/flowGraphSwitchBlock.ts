/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSwitchBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSwitchBlock.pure";

import { FlowGraphSwitchBlock } from "./flowGraphSwitchBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.Switch, FlowGraphSwitchBlock);
