/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import debugLayer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./debugLayer.pure";

import { DebugLayer } from "./debugLayer.pure";
import { Scene } from "../scene";

Object.defineProperty(Scene.prototype, "debugLayer", {
    get: function (this: Scene) {
        if (!this._debugLayer) {
            this._debugLayer = new DebugLayer(this);
        }
        return this._debugLayer;
    },
    enumerable: true,
    configurable: true,
});
