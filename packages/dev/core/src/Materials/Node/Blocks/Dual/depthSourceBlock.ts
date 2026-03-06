/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import depthSourceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./depthSourceBlock.pure";

import { DepthSourceBlock } from "./depthSourceBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.DepthSourceBlock", DepthSourceBlock);
