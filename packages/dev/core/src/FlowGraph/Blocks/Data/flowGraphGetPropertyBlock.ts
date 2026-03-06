/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphGetPropertyBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphGetPropertyBlock.pure";

import { FlowGraphGetPropertyBlock } from "./flowGraphGetPropertyBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.GetProperty, FlowGraphGetPropertyBlock);
