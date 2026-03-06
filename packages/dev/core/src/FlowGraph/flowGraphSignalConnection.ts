/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSignalConnection.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSignalConnection.pure";

import { FlowGraphSignalConnection } from "./flowGraphSignalConnection.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("FlowGraphSignalConnection", FlowGraphSignalConnection);
