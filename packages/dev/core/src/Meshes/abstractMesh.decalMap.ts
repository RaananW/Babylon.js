/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractMesh.decalMap.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractMesh.decalMap.pure";

import { Nullable } from "../types";
import { MeshUVSpaceRenderer } from "./meshUVSpaceRenderer";
import { AbstractMesh } from "../Meshes/abstractMesh";

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
