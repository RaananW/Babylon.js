/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import directAudioActions.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./directAudioActions.pure";

import { PlaySoundAction, StopSoundAction } from "./directAudioActions.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.PlaySoundAction", PlaySoundAction);

RegisterClass("BABYLON.StopSoundAction", StopSoundAction);
