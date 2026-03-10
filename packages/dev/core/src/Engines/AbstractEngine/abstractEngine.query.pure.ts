/** This file must only contain pure code and pure imports */

import { AbstractMesh } from "core/Meshes/abstractMesh";

/** @internal */
export type OcclusionQuery = WebGLQuery | number;

/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _OcclusionDataStorage {
    /** @internal */
    public occlusionInternalRetryCounter = 0;

    /** @internal */
    public isOcclusionQueryInProgress = false;

    /** @internal */
    public isOccluded = false;

    /** @internal */
    public occlusionRetryCount = -1;

    /** @internal */
    public occlusionType = AbstractMesh.OCCLUSION_TYPE_NONE;

    /** @internal */
    public occlusionQueryAlgorithmType = AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;

    /** @internal */
    public forceRenderingWhenOccluded = false;
}
