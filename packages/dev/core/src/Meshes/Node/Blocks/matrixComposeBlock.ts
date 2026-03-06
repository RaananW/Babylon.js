/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import matrixComposeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./matrixComposeBlock.pure";

import { MatrixComposeBlock } from "./matrixComposeBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.MatrixComposeBlock", MatrixComposeBlock);
