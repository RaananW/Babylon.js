/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import instancedMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instancedMesh.pure";

import { InstancedMesh } from "./instancedMesh.pure";
import type { Nullable } from "../types";
import { Mesh } from "../Meshes/mesh";
import { VertexBuffer } from "../Buffers/buffer";
import type { ThinEngine } from "../Engines/thinEngine";
import { RegisterClass } from "../Misc/typeStore";

declare module "./mesh" {
    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Mesh {
        /**
         * Register a custom buffer that will be instanced
         * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/instances#custom-buffers
         * @param kind defines the buffer kind
         * @param stride defines the stride in floats
         */
        registerInstancedBuffer(kind: string, stride: number): void;

        /**
         * Invalidate VertexArrayObjects belonging to the mesh (but not to the Geometry of the mesh).
         */
        _invalidateInstanceVertexArrayObject(): void;

        /**
         * true to use the edge renderer for all instances of this mesh
         */
        edgesShareWithInstances: boolean;

        /** @internal */
        _userInstancedBuffersStorage: {
            /** @internal */
            data: { [key: string]: Float32Array };
            /** @internal */
            sizes: { [key: string]: number };
            /** @internal */
            vertexBuffers: { [key: string]: Nullable<VertexBuffer> };
            /** @internal */
            strides: { [key: string]: number };
            /** @internal */
            vertexArrayObjects?: { [key: string]: WebGLVertexArrayObject };
            /** @internal */
            renderPasses?: {
                [renderPassId: number]: { [kind: string]: Nullable<VertexBuffer> };
            };
        };
    }
}

declare module "./abstractMesh" {
    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractMesh {
        /**
         * Object used to store instanced buffers defined by user
         * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/instances#custom-buffers
         */
        instancedBuffers: { [key: string]: any };
    }
}

Mesh._instancedMeshFactory = (name: string, mesh: Mesh): InstancedMesh => {
    const instance = new InstancedMesh(name, mesh);

    if (mesh.instancedBuffers) {
        instance.instancedBuffers = {};

        for (const key in mesh.instancedBuffers) {
            instance.instancedBuffers[key] = mesh.instancedBuffers[key];
        }
    }

    return instance;
};

Mesh.prototype.registerInstancedBuffer = function (kind: string, stride: number): void {
    // Remove existing one
    this._userInstancedBuffersStorage?.vertexBuffers[kind]?.dispose();

    // Creates the instancedBuffer field if not present
    if (!this.instancedBuffers) {
        this.instancedBuffers = {};

        for (const instance of this.instances) {
            instance.instancedBuffers = {};
        }
    }

    if (!this._userInstancedBuffersStorage) {
        this._userInstancedBuffersStorage = {
            data: {},
            vertexBuffers: {},
            strides: {},
            sizes: {},
            vertexArrayObjects: this.getEngine().getCaps().vertexArrayObject ? {} : undefined,
        };
    }

    // Creates an empty property for this kind
    this.instancedBuffers[kind] = null;

    this._userInstancedBuffersStorage.strides[kind] = stride;
    this._userInstancedBuffersStorage.sizes[kind] = stride * 32; // Initial size
    this._userInstancedBuffersStorage.data[kind] = new Float32Array(this._userInstancedBuffersStorage.sizes[kind]);
    this._userInstancedBuffersStorage.vertexBuffers[kind] = new VertexBuffer(this.getEngine(), this._userInstancedBuffersStorage.data[kind], kind, true, false, stride, true);

    for (const instance of this.instances) {
        instance.instancedBuffers[kind] = null;
    }

    this._invalidateInstanceVertexArrayObject();

    this._markSubMeshesAsAttributesDirty();
};

Mesh.prototype._processInstancedBuffers = function (visibleInstances: Nullable<InstancedMesh[]>, renderSelf: boolean) {
    const instanceCount = visibleInstances ? visibleInstances.length : 0;

    for (const kind in this.instancedBuffers) {
        let size = this._userInstancedBuffersStorage.sizes[kind];
        const stride = this._userInstancedBuffersStorage.strides[kind];

        // Resize if required
        const expectedSize = (instanceCount + 1) * stride;

        while (size < expectedSize) {
            size *= 2;
        }

        if (this._userInstancedBuffersStorage.data[kind].length != size) {
            this._userInstancedBuffersStorage.data[kind] = new Float32Array(size);
            this._userInstancedBuffersStorage.sizes[kind] = size;
            if (this._userInstancedBuffersStorage.vertexBuffers[kind]) {
                this._userInstancedBuffersStorage.vertexBuffers[kind].dispose();
                this._userInstancedBuffersStorage.vertexBuffers[kind] = null;
            }
        }

        const data = this._userInstancedBuffersStorage.data[kind];

        // Update data buffer
        let offset = 0;
        if (renderSelf) {
            const value = this.instancedBuffers[kind] ?? 0;

            if (value.toArray) {
                value.toArray(data, offset);
            } else if (value.copyToArray) {
                value.copyToArray(data, offset);
            } else {
                data[offset] = value;
            }

            offset += stride;
        }

        for (let instanceIndex = 0; instanceIndex < instanceCount; instanceIndex++) {
            const instance = visibleInstances![instanceIndex];

            const value = instance.instancedBuffers[kind] ?? 0;

            if (value.toArray) {
                value.toArray(data, offset);
            } else if (value.copyToArray) {
                value.copyToArray(data, offset);
            } else {
                data[offset] = value;
            }

            offset += stride;
        }

        // Update vertex buffer
        if (!this._userInstancedBuffersStorage.vertexBuffers[kind]) {
            this._userInstancedBuffersStorage.vertexBuffers[kind] = new VertexBuffer(
                this.getEngine(),
                this._userInstancedBuffersStorage.data[kind],
                kind,
                true,
                false,
                stride,
                true
            );
            this._invalidateInstanceVertexArrayObject();
        } else {
            this._userInstancedBuffersStorage.vertexBuffers[kind].updateDirectly(data, 0);
        }
    }
};

Mesh.prototype._invalidateInstanceVertexArrayObject = function () {
    if (!this._userInstancedBuffersStorage || this._userInstancedBuffersStorage.vertexArrayObjects === undefined) {
        return;
    }

    for (const kind in this._userInstancedBuffersStorage.vertexArrayObjects) {
        (this.getEngine() as ThinEngine).releaseVertexArrayObject(this._userInstancedBuffersStorage.vertexArrayObjects[kind]);
    }

    this._userInstancedBuffersStorage.vertexArrayObjects = {};
};

Mesh.prototype._disposeInstanceSpecificData = function () {
    for (const renderPassId in this._instanceDataStorage.renderPasses) {
        this._instanceDataStorage.renderPasses[renderPassId].instancesBuffer?.dispose();
    }
    this._instanceDataStorage.renderPasses = {};
    this._instanceDataStorage.dataStorageRenderPass?.instancesBuffer?.dispose();

    while (this.instances.length) {
        this.instances[0].dispose();
    }

    for (const kind in this.instancedBuffers) {
        if (this._userInstancedBuffersStorage.vertexBuffers[kind]) {
            this._userInstancedBuffersStorage.vertexBuffers[kind].dispose();
        }
    }

    this._invalidateInstanceVertexArrayObject();

    this.instancedBuffers = {};
};

// Register Class Name
RegisterClass("BABYLON.InstancedMesh", InstancedMesh);
