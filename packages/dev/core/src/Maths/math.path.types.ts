export {};

declare module "./math.path.pure" {
    namespace BezierCurve {
        export let Interpolate: typeof BezierCurveInterpolate;
    }
    namespace Angle {
        export let BetweenTwoPoints: typeof AngleBetweenTwoPoints;
        export let BetweenTwoVectors: typeof AngleBetweenTwoVectors;
        export let FromRadians: typeof AngleFromRadians;
        export let FromDegrees: typeof AngleFromDegrees;
    }
    namespace Path2 {
        export let StartingAt: typeof Path2StartingAt;
    }
    namespace Curve3 {
        export let CreateQuadraticBezier: typeof Curve3CreateQuadraticBezier;
        export let CreateCubicBezier: typeof Curve3CreateCubicBezier;
        export let CreateHermiteSpline: typeof Curve3CreateHermiteSpline;
        export let CreateCatmullRomSpline: typeof Curve3CreateCatmullRomSpline;
        export let ArcThru3Points: typeof Curve3ArcThru3Points;
    }
}
