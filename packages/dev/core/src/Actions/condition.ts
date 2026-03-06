/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import condition.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./condition.pure";

import { PredicateCondition, StateCondition, ValueCondition } from "./condition.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.ValueCondition", ValueCondition);

RegisterClass("BABYLON.PredicateCondition", PredicateCondition);

RegisterClass("BABYLON.StateCondition", StateCondition);
