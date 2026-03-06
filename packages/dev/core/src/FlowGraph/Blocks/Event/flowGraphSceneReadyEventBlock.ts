/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSceneReadyEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSceneReadyEventBlock.pure";

import { FlowGraphSceneReadyEventBlock } from "./flowGraphSceneReadyEventBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.SceneReadyEvent, FlowGraphSceneReadyEventBlock);
