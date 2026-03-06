/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import matrixSplitterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./matrixSplitterBlock.pure";

import { MatrixSplitterBlock } from "./matrixSplitterBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.MatrixSplitterBlock", MatrixSplitterBlock);
