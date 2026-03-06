/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphMatrixMathBlocks.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphMatrixMathBlocks.pure";

import {
    FlowGraphDeterminantBlock,
    FlowGraphInvertMatrixBlock,
    FlowGraphMatrixComposeBlock,
    FlowGraphMatrixDecomposeBlock,
    FlowGraphMatrixMultiplicationBlock,
    FlowGraphTransposeBlock,
} from "./flowGraphMatrixMathBlocks.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.Transpose, FlowGraphTransposeBlock);

RegisterClass(FlowGraphBlockNames.Determinant, FlowGraphDeterminantBlock);

RegisterClass(FlowGraphBlockNames.InvertMatrix, FlowGraphInvertMatrixBlock);

RegisterClass(FlowGraphBlockNames.MatrixMultiplication, FlowGraphMatrixMultiplicationBlock);

RegisterClass(FlowGraphBlockNames.MatrixDecompose, FlowGraphMatrixDecomposeBlock);

RegisterClass(FlowGraphBlockNames.MatrixCompose, FlowGraphMatrixComposeBlock);
