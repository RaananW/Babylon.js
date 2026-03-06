/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import triPlanarBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./triPlanarBlock.pure";

import { TriPlanarBlock } from "./triPlanarBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.TriPlanarBlock", TriPlanarBlock);
