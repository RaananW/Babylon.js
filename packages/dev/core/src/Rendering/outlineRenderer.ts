/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import outlineRenderer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./outlineRenderer.pure";

import { OutlineRenderer } from "./outlineRenderer.pure";
import { Mesh } from "../Meshes/mesh";
import { Scene } from "../scene";

/**
 * Gets the outline renderer associated with the scene
 * @returns a OutlineRenderer
 */
Scene.prototype.getOutlineRenderer = function (): OutlineRenderer {
    if (!this._outlineRenderer) {
        this._outlineRenderer = new OutlineRenderer(this);
    }
    return this._outlineRenderer;
};

Object.defineProperty(Mesh.prototype, "renderOutline", {
    get: function (this: Mesh) {
        return this._renderOutline;
    },
    set: function (this: Mesh, value: boolean) {
        if (value) {
            // Lazy Load the component.
            this.getScene().getOutlineRenderer();
        }
        this._renderOutline = value;
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(Mesh.prototype, "renderOverlay", {
    get: function (this: Mesh) {
        return this._renderOverlay;
    },
    set: function (this: Mesh, value: boolean) {
        if (value) {
            // Lazy Load the component.
            this.getScene().getOutlineRenderer();
        }
        this._renderOverlay = value;
    },
    enumerable: true,
    configurable: true,
});
