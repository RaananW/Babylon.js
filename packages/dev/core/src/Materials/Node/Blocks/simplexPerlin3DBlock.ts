/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import simplexPerlin3DBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./simplexPerlin3DBlock.pure";

import { SimplexPerlin3DBlock } from "./simplexPerlin3DBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.SimplexPerlin3DBlock", SimplexPerlin3DBlock);
