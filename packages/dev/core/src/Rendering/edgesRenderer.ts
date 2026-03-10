/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import edgesRenderer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./edgesRenderer.pure";

import { EdgesRenderer, IEdgesRendererOptions, LineEdgesRenderer } from "./edgesRenderer.pure";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { LinesMesh, InstancedLinesMesh } from "../Meshes/linesMesh";
import type { Nullable } from "../types";
import type { ShaderMaterial } from "../Materials/shaderMaterial.pure";

declare module "../scene" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal */
        _edgeRenderLineShader: Nullable<ShaderMaterial>;
    }
}

declare module "../Meshes/abstractMesh" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractMesh {
        /**
         * Gets the edgesRenderer associated with the mesh
         */
        edgesRenderer: Nullable<EdgesRenderer>;
    }
}

declare module "../Meshes/linesMesh" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface LinesMesh {
        /**
         * Enables the edge rendering mode on the mesh.
         * This mode makes the mesh edges visible
         * @param epsilon defines the maximal distance between two angles to detect a face
         * @param checkVerticesInsteadOfIndices indicates that we should check vertex list directly instead of faces
         * @returns the currentAbstractMesh
         * @see https://www.babylonjs-playground.com/#19O9TU#0
         */
        enableEdgesRendering(epsilon?: number, checkVerticesInsteadOfIndices?: boolean): AbstractMesh;
    }
}

declare module "../Meshes/linesMesh" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface InstancedLinesMesh {
        /**
         * Enables the edge rendering mode on the mesh.
         * This mode makes the mesh edges visible
         * @param epsilon defines the maximal distance between two angles to detect a face
         * @param checkVerticesInsteadOfIndices indicates that we should check vertex list directly instead of faces
         * @returns the current InstancedLinesMesh
         * @see https://www.babylonjs-playground.com/#19O9TU#0
         */
        enableEdgesRendering(epsilon?: number, checkVerticesInsteadOfIndices?: boolean): InstancedLinesMesh;
    }
}

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
