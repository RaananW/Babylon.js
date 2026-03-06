/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateFlowMapBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateFlowMapBlock.pure";

import { UpdateFlowMapBlock } from "./updateFlowMapBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.UpdateFlowMapBlock", UpdateFlowMapBlock);
