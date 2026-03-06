/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import extractHighlightsPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./extractHighlightsPostProcess.pure";

import { ExtractHighlightsPostProcess } from "./extractHighlightsPostProcess.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.ExtractHighlightsPostProcess", ExtractHighlightsPostProcess);
