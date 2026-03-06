/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import sphereBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sphereBlock.pure";

import { SphereBlock } from "./sphereBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.SphereBlock", SphereBlock);
