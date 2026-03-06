/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import setTangentsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setTangentsBlock.pure";

import { SetTangentsBlock } from "./setTangentsBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.SetTangentsBlock", SetTangentsBlock);
