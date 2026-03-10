import { Polygon, PolygonRectangle, PolygonCircle, PolygonParse, PolygonStartingAt } from "./polygonMesh.pure";

declare module "./polygonMesh.pure" {
    namespace Polygon {
        export { PolygonRectangle as Rectangle };
        export { PolygonCircle as Circle };
        export { PolygonParse as Parse };
        export { PolygonStartingAt as StartingAt };
    }
}

Polygon.Rectangle = PolygonRectangle;
Polygon.Circle = PolygonCircle;
Polygon.Parse = PolygonParse;
Polygon.StartingAt = PolygonStartingAt;

export * from "./polygonMesh.pure";
