import { BoundingBoxIntersects, BoundingBoxIsCompletelyInFrustum, BoundingBoxIsInFrustum, BoundingBox } from "./boundingBox.pure";

declare module "./boundingBox.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace BoundingBox {
        export { BoundingBoxIntersects as Intersects };
        export { BoundingBoxIsCompletelyInFrustum as IsCompletelyInFrustum };
        export { BoundingBoxIsInFrustum as IsInFrustum };
    }
}

BoundingBox.Intersects = BoundingBoxIntersects;
BoundingBox.IsCompletelyInFrustum = BoundingBoxIsCompletelyInFrustum;
BoundingBox.IsInFrustum = BoundingBoxIsInFrustum;

export * from "./boundingBox.pure";
