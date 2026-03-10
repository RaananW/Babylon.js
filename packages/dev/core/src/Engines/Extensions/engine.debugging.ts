/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.debugging.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.debugging.pure";

import { AbstractEngine } from "../../Engines/abstractEngine";

declare module "../../Engines/abstractEngine" {
    /**
     *
     */
    export interface AbstractEngine {
        /** @internal */
        _debugPushGroup(groupName: string): void;

        /** @internal */
        _debugPopGroup(): void;

        /** @internal */
        _debugInsertMarker(text: string): void;
    }
}

AbstractEngine.prototype._debugPushGroup = function (groupName: string): void {};

AbstractEngine.prototype._debugPopGroup = function (): void {};

AbstractEngine.prototype._debugInsertMarker = function (text: string): void {};
