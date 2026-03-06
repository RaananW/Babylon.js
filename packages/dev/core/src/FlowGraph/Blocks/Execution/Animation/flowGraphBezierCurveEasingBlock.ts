/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphBezierCurveEasingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphBezierCurveEasingBlock.pure";

import { FlowGraphBezierCurveEasingBlock } from "./flowGraphBezierCurveEasingBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.BezierCurveEasing, FlowGraphBezierCurveEasingBlock);
