/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.timeQuery.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.timeQuery.pure";

import { AbstractEngine } from "../abstractEngine";
import { PerfCounter } from "../../Misc/perfCounter";


AbstractEngine.prototype.getGPUFrameTimeCounter = function () {
    if (!this._gpuFrameTime) {
        this._gpuFrameTime = new PerfCounter();
    }
    return this._gpuFrameTime;
};


AbstractEngine.prototype.captureGPUFrameTime = function (value: boolean): void {
    // Do nothing. Must be implemented by child classes
};
