export {};

declare module "./math.plane.pure" {
    namespace Plane {
        export { PlaneFromArray as FromArray };
        export { PlaneFromPoints as FromPoints };
        export { PlaneFromPositionAndNormal as FromPositionAndNormal };
        export { PlaneFromPositionAndNormalToRef as FromPositionAndNormalToRef };
        export { PlaneSignedDistanceToPlaneFromPositionAndNormal as SignedDistanceToPlaneFromPositionAndNormal };
    }
}
