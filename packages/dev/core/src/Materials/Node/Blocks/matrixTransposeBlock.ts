/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import matrixTransposeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./matrixTransposeBlock.pure";

import { MatrixTransposeBlock } from "./matrixTransposeBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.MatrixTransposeBlock", MatrixTransposeBlock);
