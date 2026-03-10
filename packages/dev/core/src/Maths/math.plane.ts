import {
    Plane,
    PlaneFromArray,
    PlaneFromPoints,
    PlaneFromPositionAndNormal,
    PlaneFromPositionAndNormalToRef,
    PlaneSignedDistanceToPlaneFromPositionAndNormal,
} from "./math.plane.pure";

declare module "./math.plane.pure" {
    namespace Plane {
        export { PlaneFromArray as FromArray };
        export { PlaneFromPoints as FromPoints };
        export { PlaneFromPositionAndNormal as FromPositionAndNormal };
        export { PlaneFromPositionAndNormalToRef as FromPositionAndNormalToRef };
        export { PlaneSignedDistanceToPlaneFromPositionAndNormal as SignedDistanceToPlaneFromPositionAndNormal };
    }
}

Plane.FromArray = PlaneFromArray;
Plane.FromPoints = PlaneFromPoints;
Plane.FromPositionAndNormal = PlaneFromPositionAndNormal;
Plane.FromPositionAndNormalToRef = PlaneFromPositionAndNormalToRef;
Plane.SignedDistanceToPlaneFromPositionAndNormal = PlaneSignedDistanceToPlaneFromPositionAndNormal;

export * from "./math.plane.pure";
