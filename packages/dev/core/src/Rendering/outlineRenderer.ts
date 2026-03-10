/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import outlineRenderer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./outlineRenderer.pure";

import { OutlineRenderer } from "./outlineRenderer.pure";
import { Mesh } from "../Meshes/mesh";
import { Scene } from "../scene";

declare module "../scene" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal */
        _outlineRenderer: OutlineRenderer;

        /**
         * Gets the outline renderer associated with the scene
         * @returns a OutlineRenderer
         */
        getOutlineRenderer(): OutlineRenderer;
    }
}

declare module "../Meshes/abstractMesh" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractMesh {
        /** @internal (Backing field) */
        _renderOutline: boolean;
        /**
         * Gets or sets a boolean indicating if the outline must be rendered as well
         * @see https://www.babylonjs-playground.com/#10WJ5S#3
         */
        renderOutline: boolean;

        /** @internal (Backing field) */
        _renderOverlay: boolean;
        /**
         * Gets or sets a boolean indicating if the overlay must be rendered as well
         * @see https://www.babylonjs-playground.com/#10WJ5S#2
         */
        renderOverlay: boolean;
    }
}

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
