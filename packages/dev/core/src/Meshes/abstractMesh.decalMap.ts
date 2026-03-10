/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractMesh.decalMap.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractMesh.decalMap.pure";

import type { Nullable } from "../types";
import type { MeshUVSpaceRenderer } from "./meshUVSpaceRenderer";
import { AbstractMesh } from "../Meshes/abstractMesh";

declare module "./abstractMesh" {
    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractMesh {
        /** @internal */
        _decalMap: Nullable<MeshUVSpaceRenderer>;

        /**
         * Gets or sets the decal map for this mesh
         */
        decalMap: Nullable<MeshUVSpaceRenderer>;
    }
}

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
