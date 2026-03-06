/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import subSurfaceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./subSurfaceBlock.pure";

import { SubSurfaceBlock } from "./subSurfaceBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.SubSurfaceBlock", SubSurfaceBlock);
