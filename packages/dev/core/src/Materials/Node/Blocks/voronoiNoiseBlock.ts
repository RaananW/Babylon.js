/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import voronoiNoiseBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./voronoiNoiseBlock.pure";

import { VoronoiNoiseBlock } from "./voronoiNoiseBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.VoronoiNoiseBlock", VoronoiNoiseBlock);
