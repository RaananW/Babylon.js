/**
 * Re-exports all pure math.frustum types and attaches static methods at runtime.
 * Import math.frustum.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./math.frustum.pure";

import {
    Frustum,
    FrustumGetPlanes,
    FrustumGetNearPlaneToRef,
    FrustumGetFarPlaneToRef,
    FrustumGetLeftPlaneToRef,
    FrustumGetRightPlaneToRef,
    FrustumGetTopPlaneToRef,
    FrustumGetBottomPlaneToRef,
    FrustumGetPlanesToRef,
    FrustumIsPointInFrustum,
} from "./math.frustum.pure";

declare module "./math.frustum.pure" {
    namespace Frustum {
        export let GetPlanes: typeof FrustumGetPlanes;
        export let GetNearPlaneToRef: typeof FrustumGetNearPlaneToRef;
        export let GetFarPlaneToRef: typeof FrustumGetFarPlaneToRef;
        export let GetLeftPlaneToRef: typeof FrustumGetLeftPlaneToRef;
        export let GetRightPlaneToRef: typeof FrustumGetRightPlaneToRef;
        export let GetTopPlaneToRef: typeof FrustumGetTopPlaneToRef;
        export let GetBottomPlaneToRef: typeof FrustumGetBottomPlaneToRef;
        export let GetPlanesToRef: typeof FrustumGetPlanesToRef;
        export let IsPointInFrustum: typeof FrustumIsPointInFrustum;
    }
}

// Frustum static methods
Frustum.GetPlanes = FrustumGetPlanes;
Frustum.GetNearPlaneToRef = FrustumGetNearPlaneToRef;
Frustum.GetFarPlaneToRef = FrustumGetFarPlaneToRef;
Frustum.GetLeftPlaneToRef = FrustumGetLeftPlaneToRef;
Frustum.GetRightPlaneToRef = FrustumGetRightPlaneToRef;
Frustum.GetTopPlaneToRef = FrustumGetTopPlaneToRef;
Frustum.GetBottomPlaneToRef = FrustumGetBottomPlaneToRef;
Frustum.GetPlanesToRef = FrustumGetPlanesToRef;
Frustum.IsPointInFrustum = FrustumIsPointInFrustum;
