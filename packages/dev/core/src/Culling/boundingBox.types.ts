export {};

declare module "./boundingBox.pure" {
    namespace BoundingBox {
        export { BoundingBoxIntersects as Intersects };
        export { BoundingBoxIsCompletelyInFrustum as IsCompletelyInFrustum };
        export { BoundingBoxIsInFrustum as IsInFrustum };
    }
}
