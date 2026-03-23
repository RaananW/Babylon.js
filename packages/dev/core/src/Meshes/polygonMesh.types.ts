export {};

declare module "./polygonMesh.pure" {
    namespace Polygon {
        export { PolygonRectangle as Rectangle };
        export { PolygonCircle as Circle };
        export { PolygonParse as Parse };
        export { PolygonStartingAt as StartingAt };
    }
}
