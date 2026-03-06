/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gridBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gridBlock.pure";

import { GridBlock } from "./gridBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.GridBlock", GridBlock);
