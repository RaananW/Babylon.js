/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphMathCombineExtractBlocks.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphMathCombineExtractBlocks.pure";

import {
    FlowGraphCombineMatrix2DBlock,
    FlowGraphCombineMatrix3DBlock,
    FlowGraphCombineMatrixBlock,
    FlowGraphCombineVector2Block,
    FlowGraphCombineVector3Block,
    FlowGraphCombineVector4Block,
    FlowGraphExtractMatrix2DBlock,
    FlowGraphExtractMatrix3DBlock,
    FlowGraphExtractMatrixBlock,
    FlowGraphExtractVector2Block,
    FlowGraphExtractVector3Block,
    FlowGraphExtractVector4Block,
} from "./flowGraphMathCombineExtractBlocks.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.CombineVector2, FlowGraphCombineVector2Block);

RegisterClass(FlowGraphBlockNames.CombineVector3, FlowGraphCombineVector3Block);

RegisterClass(FlowGraphBlockNames.CombineVector4, FlowGraphCombineVector4Block);

RegisterClass(FlowGraphBlockNames.CombineMatrix, FlowGraphCombineMatrixBlock);

RegisterClass(FlowGraphBlockNames.CombineMatrix2D, FlowGraphCombineMatrix2DBlock);

RegisterClass(FlowGraphBlockNames.CombineMatrix3D, FlowGraphCombineMatrix3DBlock);

RegisterClass(FlowGraphBlockNames.ExtractVector2, FlowGraphExtractVector2Block);

RegisterClass(FlowGraphBlockNames.ExtractVector3, FlowGraphExtractVector3Block);

RegisterClass(FlowGraphBlockNames.ExtractVector4, FlowGraphExtractVector4Block);

RegisterClass(FlowGraphBlockNames.ExtractMatrix, FlowGraphExtractMatrixBlock);

RegisterClass(FlowGraphBlockNames.ExtractMatrix2D, FlowGraphExtractMatrix2DBlock);

RegisterClass(FlowGraphBlockNames.ExtractMatrix3D, FlowGraphExtractMatrix3DBlock);
