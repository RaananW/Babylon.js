/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import boundingBoxRenderer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./boundingBoxRenderer.pure";

import { BoundingBoxRenderer } from "./boundingBoxRenderer.pure";
import { Scene } from "../scene";
import { AbstractMesh } from "../Meshes/abstractMesh";

Object.defineProperty(Scene.prototype, "forceShowBoundingBoxes", {
    get: function (this: Scene) {
        return this._forceShowBoundingBoxes || false;
    },
    set: function (this: Scene, value: boolean) {
        this._forceShowBoundingBoxes = value;
        // Lazyly creates a BB renderer if needed.
        if (value) {
            this.getBoundingBoxRenderer();
        }
    },
    enumerable: true,
    configurable: true,
});

Scene.prototype.getBoundingBoxRenderer = function (): BoundingBoxRenderer {
    if (!this._boundingBoxRenderer) {
        this._boundingBoxRenderer = new BoundingBoxRenderer(this);
    }

    return this._boundingBoxRenderer;
};

Object.defineProperty(AbstractMesh.prototype, "showBoundingBox", {
    get: function (this: AbstractMesh) {
        return this._showBoundingBox || false;
    },
    set: function (this: AbstractMesh, value: boolean) {
        this._showBoundingBox = value;
        // Lazyly creates a BB renderer if needed.
        if (value) {
            this.getScene().getBoundingBoxRenderer();
        }
    },
    enumerable: true,
    configurable: true,
});
