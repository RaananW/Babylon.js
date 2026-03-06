/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import directActions.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./directActions.pure";

import {
    CombineAction,
    DoNothingAction,
    ExecuteCodeAction,
    IncrementValueAction,
    PlayAnimationAction,
    SetParentAction,
    SetStateAction,
    SetValueAction,
    StopAnimationAction,
    SwitchBooleanAction,
} from "./directActions.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.SetParentAction", SetParentAction);

RegisterClass("BABYLON.ExecuteCodeAction", ExecuteCodeAction);

RegisterClass("BABYLON.DoNothingAction", DoNothingAction);

RegisterClass("BABYLON.StopAnimationAction", StopAnimationAction);

RegisterClass("BABYLON.PlayAnimationAction", PlayAnimationAction);

RegisterClass("BABYLON.IncrementValueAction", IncrementValueAction);

RegisterClass("BABYLON.SetValueAction", SetValueAction);

RegisterClass("BABYLON.SetStateAction", SetStateAction);

RegisterClass("BABYLON.SetParentAction", SetParentAction);

RegisterClass("BABYLON.SwitchBooleanAction", SwitchBooleanAction);

RegisterClass("BABYLON.CombineAction", CombineAction);
