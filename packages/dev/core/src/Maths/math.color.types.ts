export {};

declare module "./math.color.pure" {
    namespace Color3 {
        export let HSVtoRGBToRef: typeof Color3HSVtoRGBToRef;
        export let FromHSV: typeof Color3FromHSV;
        export let FromHexString: typeof Color3FromHexString;
        export let FromArray: typeof Color3FromArray;
        export let FromArrayToRef: typeof Color3FromArrayToRef;
        export let FromInts: typeof Color3FromInts;
        export let Lerp: typeof Color3Lerp;
        export let LerpToRef: typeof Color3LerpToRef;
        export let Hermite: typeof Color3Hermite;
        export let Hermite1stDerivative: typeof Color3Hermite1stDerivative;
        export let Hermite1stDerivativeToRef: typeof Color3Hermite1stDerivativeToRef;
        export let Red: typeof Color3Red;
        export let Green: typeof Color3Green;
        export let Blue: typeof Color3Blue;
        export let Black: typeof Color3Black;
        export let White: typeof Color3White;
        export let Purple: typeof Color3Purple;
        export let Magenta: typeof Color3Magenta;
        export let Yellow: typeof Color3Yellow;
        export let Gray: typeof Color3Gray;
        export let Teal: typeof Color3Teal;
        export let Random: typeof Color3Random;
    }
    namespace Color4 {
        export let FromHexString: typeof Color4FromHexString;
        export let Lerp: typeof Color4Lerp;
        export let LerpToRef: typeof Color4LerpToRef;
        export let Hermite: typeof Color4Hermite;
        export let Hermite1stDerivative: typeof Color4Hermite1stDerivative;
        export let Hermite1stDerivativeToRef: typeof Color4Hermite1stDerivativeToRef;
        export let FromColor3: typeof Color4FromColor3;
        export let FromArray: typeof Color4FromArray;
        export let FromArrayToRef: typeof Color4FromArrayToRef;
        export let FromInts: typeof Color4FromInts;
        export let CheckColors4: typeof Color4CheckColors4;
    }
}
