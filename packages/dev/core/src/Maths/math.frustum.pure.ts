/** This file must only contain pure code and pure imports */

export * from "./math.frustum.types";

import type { Matrix, Vector3 } from "./math.vector";
import type { DeepImmutable } from "../types";
import { Plane } from "./math.plane.pure";

/**
 * Represents a camera frustum
 */
export class Frustum {}

/**
 * Gets the planes representing the frustum
 * @param transform matrix to be applied to the returned planes
 * @returns a new array of 6 Frustum planes computed by the given transformation matrix.
 */
export function FrustumGetPlanes(transform: DeepImmutable<Matrix>): Plane[] {
    const frustumPlanes = [];
    for (let index = 0; index < 6; index++) {
        frustumPlanes.push(new Plane(0.0, 0.0, 0.0, 0.0));
    }
    FrustumGetPlanesToRef(transform, frustumPlanes);
    return frustumPlanes;
}

/**
 * Gets the near frustum plane transformed by the transform matrix
 * @param transform transformation matrix to be applied to the resulting frustum plane
 * @param frustumPlane the resulting frustum plane
 */
export function FrustumGetNearPlaneToRef(transform: DeepImmutable<Matrix>, frustumPlane: Plane): void {
    const m = transform.m;
    frustumPlane.normal.x = m[3] + m[2];
    frustumPlane.normal.y = m[7] + m[6];
    frustumPlane.normal.z = m[11] + m[10];
    frustumPlane.d = m[15] + m[14];
    frustumPlane.normalize();
}

/**
 * Gets the far frustum plane transformed by the transform matrix
 * @param transform transformation matrix to be applied to the resulting frustum plane
 * @param frustumPlane the resulting frustum plane
 */
export function FrustumGetFarPlaneToRef(transform: DeepImmutable<Matrix>, frustumPlane: Plane): void {
    const m = transform.m;
    frustumPlane.normal.x = m[3] - m[2];
    frustumPlane.normal.y = m[7] - m[6];
    frustumPlane.normal.z = m[11] - m[10];
    frustumPlane.d = m[15] - m[14];
    frustumPlane.normalize();
}

/**
 * Gets the left frustum plane transformed by the transform matrix
 * @param transform transformation matrix to be applied to the resulting frustum plane
 * @param frustumPlane the resulting frustum plane
 */
export function FrustumGetLeftPlaneToRef(transform: DeepImmutable<Matrix>, frustumPlane: Plane): void {
    const m = transform.m;
    frustumPlane.normal.x = m[3] + m[0];
    frustumPlane.normal.y = m[7] + m[4];
    frustumPlane.normal.z = m[11] + m[8];
    frustumPlane.d = m[15] + m[12];
    frustumPlane.normalize();
}

/**
 * Gets the right frustum plane transformed by the transform matrix
 * @param transform transformation matrix to be applied to the resulting frustum plane
 * @param frustumPlane the resulting frustum plane
 */
export function FrustumGetRightPlaneToRef(transform: DeepImmutable<Matrix>, frustumPlane: Plane): void {
    const m = transform.m;
    frustumPlane.normal.x = m[3] - m[0];
    frustumPlane.normal.y = m[7] - m[4];
    frustumPlane.normal.z = m[11] - m[8];
    frustumPlane.d = m[15] - m[12];
    frustumPlane.normalize();
}

/**
 * Gets the top frustum plane transformed by the transform matrix
 * @param transform transformation matrix to be applied to the resulting frustum plane
 * @param frustumPlane the resulting frustum plane
 */
export function FrustumGetTopPlaneToRef(transform: DeepImmutable<Matrix>, frustumPlane: Plane): void {
    const m = transform.m;
    frustumPlane.normal.x = m[3] - m[1];
    frustumPlane.normal.y = m[7] - m[5];
    frustumPlane.normal.z = m[11] - m[9];
    frustumPlane.d = m[15] - m[13];
    frustumPlane.normalize();
}

/**
 * Gets the bottom frustum plane transformed by the transform matrix
 * @param transform transformation matrix to be applied to the resulting frustum plane
 * @param frustumPlane the resulting frustum plane
 */
export function FrustumGetBottomPlaneToRef(transform: DeepImmutable<Matrix>, frustumPlane: Plane): void {
    const m = transform.m;
    frustumPlane.normal.x = m[3] + m[1];
    frustumPlane.normal.y = m[7] + m[5];
    frustumPlane.normal.z = m[11] + m[9];
    frustumPlane.d = m[15] + m[13];
    frustumPlane.normalize();
}

/**
 * Sets the given array "frustumPlanes" with the 6 Frustum planes computed by the given transformation matrix.
 * @param transform transformation matrix to be applied to the resulting frustum planes
 * @param frustumPlanes the resulting frustum planes
 */
export function FrustumGetPlanesToRef(transform: DeepImmutable<Matrix>, frustumPlanes: Plane[]): void {
    // Near
    FrustumGetNearPlaneToRef(transform, frustumPlanes[0]);

    // Far
    FrustumGetFarPlaneToRef(transform, frustumPlanes[1]);

    // Left
    FrustumGetLeftPlaneToRef(transform, frustumPlanes[2]);

    // Right
    FrustumGetRightPlaneToRef(transform, frustumPlanes[3]);

    // Top
    FrustumGetTopPlaneToRef(transform, frustumPlanes[4]);

    // Bottom
    FrustumGetBottomPlaneToRef(transform, frustumPlanes[5]);
}

/**
 * Tests if a point is located between the frustum planes.
 * @param point defines the point to test
 * @param frustumPlanes defines the frustum planes to test
 * @returns true if the point is located between the frustum planes
 */
export function FrustumIsPointInFrustum(point: Vector3, frustumPlanes: Array<DeepImmutable<Plane>>): boolean {
    for (let i = 0; i < 6; i++) {
        if (frustumPlanes[i].dotCoordinate(point) < 0) {
            return false;
        }
    }
    return true;
}

let _registered = false;

/**
 * Register side effects for math.frustum.
 * Safe to call multiple times; only the first call has an effect.
 */
export function registerMathFrustum(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    Frustum.GetPlanes = FrustumGetPlanes;
    Frustum.GetNearPlaneToRef = FrustumGetNearPlaneToRef;
    Frustum.GetFarPlaneToRef = FrustumGetFarPlaneToRef;
    Frustum.GetLeftPlaneToRef = FrustumGetLeftPlaneToRef;
    Frustum.GetRightPlaneToRef = FrustumGetRightPlaneToRef;
    Frustum.GetTopPlaneToRef = FrustumGetTopPlaneToRef;
    Frustum.GetBottomPlaneToRef = FrustumGetBottomPlaneToRef;
    Frustum.GetPlanesToRef = FrustumGetPlanesToRef;
    Frustum.IsPointInFrustum = FrustumIsPointInFrustum;
}
