import { BoundingSphere, BoundingSphereIntersects } from "./boundingSphere.pure";

declare module "./boundingSphere.pure" {
    namespace BoundingSphere {
        export { BoundingSphereIntersects as Intersects };
    }
}

BoundingSphere.Intersects = BoundingSphereIntersects;

export * from "./boundingSphere.pure";
