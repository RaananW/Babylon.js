/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.debugging.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.debugging.pure";

import { AbstractEngine } from "../../Engines/abstractEngine";


AbstractEngine.prototype._debugPushGroup = function (groupName: string): void {};


AbstractEngine.prototype._debugPopGroup = function (): void {};


AbstractEngine.prototype._debugInsertMarker = function (text: string): void {};
