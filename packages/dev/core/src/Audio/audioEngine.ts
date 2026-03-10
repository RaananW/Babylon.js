/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import audioEngine.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./audioEngine.pure";

import { AudioEngine } from "./audioEngine.pure";
import type { Nullable } from "../types";
import { AbstractEngine } from "../Engines/abstractEngine";

// Sets the default audio engine to Babylon.js
AbstractEngine.AudioEngineFactory = (
    hostElement: Nullable<HTMLElement>,
    audioContext: Nullable<AudioContext>,
    audioDestination: Nullable<AudioDestinationNode | MediaStreamAudioDestinationNode>
) => {
    return new AudioEngine(hostElement, audioContext, audioDestination);
};
