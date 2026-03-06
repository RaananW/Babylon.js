/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import icoSphereBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./icoSphereBlock.pure";

import { IcoSphereBlock } from "./icoSphereBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.IcoSphereBlock", IcoSphereBlock);
