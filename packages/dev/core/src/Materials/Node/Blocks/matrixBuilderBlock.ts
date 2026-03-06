/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import matrixBuilderBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./matrixBuilderBlock.pure";

import { MatrixBuilderBlock } from "./matrixBuilderBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.MatrixBuilder", MatrixBuilderBlock);
