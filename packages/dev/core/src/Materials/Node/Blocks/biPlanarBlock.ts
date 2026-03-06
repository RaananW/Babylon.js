/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import biPlanarBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./biPlanarBlock.pure";

import { BiPlanarBlock } from "./biPlanarBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.BiPlanarBlock", BiPlanarBlock);
