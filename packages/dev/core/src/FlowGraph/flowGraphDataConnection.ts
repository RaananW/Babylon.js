/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphDataConnection.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphDataConnection.pure";

import { FlowGraphDataConnection } from "./flowGraphDataConnection.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("FlowGraphDataConnection", FlowGraphDataConnection);
