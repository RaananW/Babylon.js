/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import edgesRenderer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./edgesRenderer.pure";

import { EdgesRenderer, IEdgesRendererOptions, LineEdgesRenderer } from "./edgesRenderer.pure";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { LinesMesh, InstancedLinesMesh } from "../Meshes/linesMesh";

AbstractMesh.prototype.disableEdgesRendering = function (): AbstractMesh {
    if (this._edgesRenderer) {
        this._edgesRenderer.dispose();
        this._edgesRenderer = null;
    }
    return this;
};

AbstractMesh.prototype.enableEdgesRendering = function (epsilon = 0.95, checkVerticesInsteadOfIndices = false, options?: IEdgesRendererOptions): AbstractMesh {
    this.disableEdgesRendering();
    this._edgesRenderer = new EdgesRenderer(this, epsilon, checkVerticesInsteadOfIndices, true, options);
    return this;
};

Object.defineProperty(AbstractMesh.prototype, "edgesRenderer", {
    get: function (this: AbstractMesh) {
        return this._edgesRenderer;
    },
    enumerable: true,
    configurable: true,
});

LinesMesh.prototype.enableEdgesRendering = function (epsilon = 0.95, checkVerticesInsteadOfIndices = false): AbstractMesh {
    this.disableEdgesRendering();
    this._edgesRenderer = new LineEdgesRenderer(this, epsilon, checkVerticesInsteadOfIndices);
    return this;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
InstancedLinesMesh.prototype.enableEdgesRendering = function (epsilon = 0.95, checkVerticesInsteadOfIndices = false): InstancedLinesMesh {
    LinesMesh.prototype.enableEdgesRendering.apply(this, arguments);
    return this;
};
