import {
    SphericalHarmonics,
    SphericalPolynomial,
    SphericalHarmonicsFromArray,
    SphericalHarmonicsFromPolynomial,
    SphericalPolynomialFromHarmonics,
    SphericalPolynomialFromArray,
} from "./sphericalPolynomial.pure";

declare module "./sphericalPolynomial.pure" {
    namespace SphericalHarmonics {
        export let FromArray: typeof SphericalHarmonicsFromArray;
        export let FromPolynomial: typeof SphericalHarmonicsFromPolynomial;
    }
    namespace SphericalPolynomial {
        export let FromHarmonics: typeof SphericalPolynomialFromHarmonics;
        export let FromArray: typeof SphericalPolynomialFromArray;
    }
}
SphericalHarmonics.FromArray = SphericalHarmonicsFromArray;
SphericalHarmonics.FromPolynomial = SphericalHarmonicsFromPolynomial;
SphericalPolynomial.FromHarmonics = SphericalPolynomialFromHarmonics;
SphericalPolynomial.FromArray = SphericalPolynomialFromArray;

export * from "./sphericalPolynomial.pure";
