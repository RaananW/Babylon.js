export * from "./abstractEngine.timeQuery.types";

import { AbstractEngine } from "../abstractEngine";
import { PerfCounter } from "../../Misc/perfCounter";

let _registered = false;

/**
 * Register side effects for abstractEngine.timeQuery.
 * Safe to call multiple times; only the first call has an effect.
 */
export function registerAbstractEngineTimeQuery(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    AbstractEngine.prototype.getGPUFrameTimeCounter = function () {
        if (!this._gpuFrameTime) {
            this._gpuFrameTime = new PerfCounter();
        }
        return this._gpuFrameTime;
    };

    AbstractEngine.prototype.captureGPUFrameTime = function (value: boolean): void {
        // Do nothing. Must be implemented by child classes
    };
}
