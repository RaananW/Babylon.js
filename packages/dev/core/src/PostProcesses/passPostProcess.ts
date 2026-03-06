/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import passPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./passPostProcess.pure";

import { Constants } from "../Engines/constants";
import { AbstractEngine } from "../Engines/abstractEngine";
import { RegisterClass } from "../Misc/typeStore";


RegisterClass("BABYLON.PassPostProcess", PassPostProcess);


AbstractEngine._RescalePostProcessFactory = (engine: AbstractEngine) => {
    return new PassPostProcess("rescale", 1, null, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, engine, false, Constants.TEXTURETYPE_UNSIGNED_BYTE);
};
