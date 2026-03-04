/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Re-exports all pure math.polar types and attaches static methods at runtime.
 * Import math.polar.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./math.polar.pure";

import {
    Polar,
    PolarFromVector2ToRef,
    PolarFromVector2,
    PolarFromArray,
    Spherical,
    SphericalFromVector3ToRef,
    SphericalFromVector3,
    SphericalFromArray,
} from "./math.polar.pure";

declare module "./math.polar.pure" {
    namespace Polar {
        export let FromVector2ToRef: typeof PolarFromVector2ToRef;
        export let FromVector2: typeof PolarFromVector2;
        export let FromArray: typeof PolarFromArray;
    }
    namespace Spherical {
        export let FromVector3ToRef: typeof SphericalFromVector3ToRef;
        export let FromVector3: typeof SphericalFromVector3;
        export let FromArray: typeof SphericalFromArray;
    }
}

// Polar static methods
Polar.FromVector2ToRef = PolarFromVector2ToRef;
Polar.FromVector2 = PolarFromVector2;
Polar.FromArray = PolarFromArray;

// Spherical static methods
Spherical.FromVector3ToRef = SphericalFromVector3ToRef;
Spherical.FromVector3 = SphericalFromVector3;
Spherical.FromArray = SphericalFromArray;
