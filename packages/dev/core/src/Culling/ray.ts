/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import ray.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ray.pure";

import { Nullable } from "../types";
import { Matrix } from "../Maths/math.vector";
import { PickingInfo } from "../Collisions/pickingInfo";
import { Scene } from "../scene";
import { Camera } from "../Cameras/camera";
import type { MeshPredicate, TrianglePickingPredicate } from "./ray.core";
import {
    Ray,
    AddRayExtensions,
    CreatePickingRayInCameraSpace,
    CreatePickingRayInCameraSpaceToRef,
    CreatePickingRayToRef,
    MultiPick,
    MultiPickWithRay,
    Pick,
    PickWithBoundingInfo,
    PickWithRay,
    RayZero,
    RayCreateNew,
    RayCreateNewFromTo,
    RayCreateFromToToRef,
    RayTransform,
    RayTransformToRef,
} from "./ray.core";

Ray.Zero = RayZero;

Ray.CreateNew = RayCreateNew;

Ray.CreateNewFromTo = RayCreateNewFromTo;

Ray.CreateFromToToRef = RayCreateFromToToRef;

Ray.Transform = RayTransform;

Ray.TransformToRef = RayTransformToRef;

// Picking
AddRayExtensions(Scene, Camera);

Scene.prototype.createPickingRayToRef = function (
    x: number,
    y: number,
    world: Nullable<Matrix>,
    result: Ray,
    camera: Nullable<Camera>,
    cameraViewSpace = false,
    enableDistantPicking = false
): Scene {
    return CreatePickingRayToRef(this, x, y, world, result, camera, cameraViewSpace, enableDistantPicking);
};

Scene.prototype.createPickingRayInCameraSpace = function (x: number, y: number, camera?: Camera): Ray {
    return CreatePickingRayInCameraSpace(this, x, y, camera);
};

Scene.prototype.createPickingRayInCameraSpaceToRef = function (x: number, y: number, result: Ray, camera?: Camera): Scene {
    return CreatePickingRayInCameraSpaceToRef(this, x, y, result, camera);
};

Scene.prototype.pickWithBoundingInfo = function (x: number, y: number, predicate?: MeshPredicate, fastCheck?: boolean, camera?: Nullable<Camera>): Nullable<PickingInfo> {
    return PickWithBoundingInfo(this, x, y, predicate, fastCheck, camera);
};

Scene.prototype.pick = function (
    x: number,
    y: number,
    predicate?: MeshPredicate,
    fastCheck?: boolean,
    camera?: Nullable<Camera>,
    trianglePredicate?: TrianglePickingPredicate,
    _enableDistantPicking = false
): PickingInfo {
    return Pick(this, x, y, predicate, fastCheck, camera, trianglePredicate, _enableDistantPicking);
};

Scene.prototype.pickWithRay = function (ray: Ray, predicate?: MeshPredicate, fastCheck?: boolean, trianglePredicate?: TrianglePickingPredicate): Nullable<PickingInfo> {
    return PickWithRay(this, ray, predicate, fastCheck, trianglePredicate);
};

Scene.prototype.multiPick = function (x: number, y: number, predicate?: MeshPredicate, camera?: Camera, trianglePredicate?: TrianglePickingPredicate): Nullable<PickingInfo[]> {
    return MultiPick(this, x, y, predicate, camera, trianglePredicate);
};

Scene.prototype.multiPickWithRay = function (ray: Ray, predicate?: MeshPredicate, trianglePredicate?: TrianglePickingPredicate): Nullable<PickingInfo[]> {
    return MultiPickWithRay(this, ray, predicate, trianglePredicate);
};
