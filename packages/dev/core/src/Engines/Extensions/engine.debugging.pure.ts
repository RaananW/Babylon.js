export * from "./engine.debugging.types";

import { AbstractEngine } from "../../Engines/abstractEngine";

let _registered = false;

/**
 * Register side effects for engine.debugging.
 * Safe to call multiple times; only the first call has an effect.
 */
export function registerEngineDebugging(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    AbstractEngine.prototype._debugPushGroup = function (groupName: string): void {};

    AbstractEngine.prototype._debugPopGroup = function (): void {};

    AbstractEngine.prototype._debugInsertMarker = function (text: string): void {};
}
