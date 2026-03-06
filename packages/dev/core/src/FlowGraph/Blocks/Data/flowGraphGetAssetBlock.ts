/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphGetAssetBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphGetAssetBlock.pure";

import { FlowGraphGetAssetBlock } from "./flowGraphGetAssetBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.GetAsset, FlowGraphGetAssetBlock);
