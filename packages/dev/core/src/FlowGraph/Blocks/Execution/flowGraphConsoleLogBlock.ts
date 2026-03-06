/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphConsoleLogBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphConsoleLogBlock.pure";

import { FlowGraphConsoleLogBlock } from "./flowGraphConsoleLogBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.ConsoleLog, FlowGraphConsoleLogBlock);
