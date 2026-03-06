/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import torusBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./torusBlock.pure";

import { TorusBlock } from "./torusBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.TorusBlock", TorusBlock);
