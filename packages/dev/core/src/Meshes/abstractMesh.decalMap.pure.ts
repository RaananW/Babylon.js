export * from "./abstractMesh.decalMap.types";

import type { Nullable } from "../types";
import type { MeshUVSpaceRenderer } from "./meshUVSpaceRenderer";
import { AbstractMesh } from "../Meshes/abstractMesh";

let _registered = false;

/**
 * Register side effects for abstractMesh.decalMap.
 * Safe to call multiple times; only the first call has an effect.
 */
export function registerAbstractMeshDecalMap(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    Object.defineProperty(AbstractMesh.prototype, "decalMap", {
        get: function (this: AbstractMesh) {
            return this._decalMap;
        },
        set: function (this: AbstractMesh, decalMap: Nullable<MeshUVSpaceRenderer>) {
            this._decalMap = decalMap;
        },
        enumerable: true,
        configurable: true,
    });
}
