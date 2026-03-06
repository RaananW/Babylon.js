/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractMesh.decalMap.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractMesh.decalMap.pure";

import { AbstractMesh } from "../Meshes/abstractMesh";
import type { Nullable } from "../types";
import type { MeshUVSpaceRenderer } from "./meshUVSpaceRenderer";


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
