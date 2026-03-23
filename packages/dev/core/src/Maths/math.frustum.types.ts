export {};

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
