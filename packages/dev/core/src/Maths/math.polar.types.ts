export {};

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
