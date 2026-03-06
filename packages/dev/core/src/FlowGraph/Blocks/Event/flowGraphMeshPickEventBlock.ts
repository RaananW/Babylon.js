/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphMeshPickEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphMeshPickEventBlock.pure";

import { FlowGraphMeshPickEventBlock } from "./flowGraphMeshPickEventBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass(FlowGraphBlockNames.MeshPickEvent, FlowGraphMeshPickEventBlock);
