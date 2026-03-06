/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphTransformCoordinatesSystemBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphTransformCoordinatesSystemBlock.pure";

import { FlowGraphTransformCoordinatesSystemBlock } from "./flowGraphTransformCoordinatesSystemBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.TransformCoordinatesSystem, FlowGraphTransformCoordinatesSystemBlock);
