export {};

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
