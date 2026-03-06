/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSceneTickEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSceneTickEventBlock.pure";

import { FlowGraphSceneTickEventBlock } from "./flowGraphSceneTickEventBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.SceneTickEvent, FlowGraphSceneTickEventBlock);
