import { BoundingSphere, BoundingSphereIntersects } from "./boundingSphere.pure";

declare module "./boundingSphere.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace BoundingSphere {
        export { BoundingSphereIntersects as Intersects };
    }
}

BoundingSphere.Intersects = BoundingSphereIntersects;

export * from "./boundingSphere.pure";
