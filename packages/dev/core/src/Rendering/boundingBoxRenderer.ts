/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import boundingBoxRenderer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./boundingBoxRenderer.pure";

import { BoundingBoxRenderer } from "./boundingBoxRenderer.pure";
import { Scene } from "../scene";
import { AbstractMesh } from "../Meshes/abstractMesh";

declare module "../scene" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal (Backing field) */
        _boundingBoxRenderer: BoundingBoxRenderer;

        /** @internal (Backing field) */
        _forceShowBoundingBoxes: boolean;

        /**
         * Gets or sets a boolean indicating if all bounding boxes must be rendered
         */
        forceShowBoundingBoxes: boolean;

        /**
         * Gets the bounding box renderer associated with the scene
         * @returns a BoundingBoxRenderer
         */
        getBoundingBoxRenderer(): BoundingBoxRenderer;
    }
}

declare module "../Meshes/abstractMesh" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractMesh {
        /** @internal (Backing field) */
        _showBoundingBox: boolean;

        /**
         * Gets or sets a boolean indicating if the bounding box must be rendered as well (false by default)
         */
        showBoundingBox: boolean;
    }
}

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
