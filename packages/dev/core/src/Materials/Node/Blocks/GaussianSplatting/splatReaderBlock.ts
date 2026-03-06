/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import splatReaderBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./splatReaderBlock.pure";

import { SplatReaderBlock } from "./splatReaderBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.SplatReaderBlock", SplatReaderBlock);
