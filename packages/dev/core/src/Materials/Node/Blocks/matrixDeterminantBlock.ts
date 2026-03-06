/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import matrixDeterminantBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./matrixDeterminantBlock.pure";

import { MatrixDeterminantBlock } from "./matrixDeterminantBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.MatrixDeterminantBlock", MatrixDeterminantBlock);
