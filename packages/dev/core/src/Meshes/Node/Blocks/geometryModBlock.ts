/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryModBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryModBlock.pure";

import { GeometryModBlock } from "./geometryModBlock.pure";
import { RegisterClass } from "../../../Misc/typeStore";

RegisterClass("BABYLON.GeometryModBlock", GeometryModBlock);
