/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import refractionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./refractionBlock.pure";

import { RefractionBlock } from "./refractionBlock.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

RegisterClass("BABYLON.RefractionBlock", RefractionBlock);
