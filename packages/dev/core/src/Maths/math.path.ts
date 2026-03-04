/**
 * Re-exports all pure math.path types and attaches static methods at runtime.
 * Import math.path.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./math.path.pure";

import {
    BezierCurve,
    BezierCurveInterpolate,
    Angle,
    AngleBetweenTwoPoints,
    AngleBetweenTwoVectors,
    AngleFromRadians,
    AngleFromDegrees,
    Path2,
    Path2StartingAt,
    Curve3,
    Curve3CreateQuadraticBezier,
    Curve3CreateCubicBezier,
    Curve3CreateHermiteSpline,
    Curve3CreateCatmullRomSpline,
    Curve3ArcThru3Points,
} from "./math.path.pure";

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

// BezierCurve static methods
BezierCurve.Interpolate = BezierCurveInterpolate;

// Angle static methods
Angle.BetweenTwoPoints = AngleBetweenTwoPoints;
Angle.BetweenTwoVectors = AngleBetweenTwoVectors;
Angle.FromRadians = AngleFromRadians;
Angle.FromDegrees = AngleFromDegrees;

// Path2 static methods
Path2.StartingAt = Path2StartingAt;

// Curve3 static methods
Curve3.CreateQuadraticBezier = Curve3CreateQuadraticBezier;
Curve3.CreateCubicBezier = Curve3CreateCubicBezier;
Curve3.CreateHermiteSpline = Curve3CreateHermiteSpline;
Curve3.CreateCatmullRomSpline = Curve3CreateCatmullRomSpline;
Curve3.ArcThru3Points = Curve3ArcThru3Points;
