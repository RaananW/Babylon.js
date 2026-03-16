import type { Nullable } from "../types";
import type { ShaderMaterial } from "../Materials/shaderMaterial.pure";
import type { EdgesRenderer } from "./edgesRenderer.pure";
import type { AbstractMesh } from "../Meshes/abstractMesh";

declare module "../scene" {
    /**
     *
     */
    export interface Scene {
        /** @internal */
        _edgeRenderLineShader: Nullable<ShaderMaterial>;
    }
}

declare module "../Meshes/abstractMesh" {
    /**
     *
     */
    export interface AbstractMesh {
        /**
         * Gets the edgesRenderer associated with the mesh
         */
        edgesRenderer: Nullable<EdgesRenderer>;
    }
}

declare module "../Meshes/linesMesh" {
    /**
     *
     */
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
    /**
     *
     */
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
