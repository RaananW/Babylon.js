/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import math.color.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./math.color.pure";

import {
    Color3,
    Color3Black,
    Color3Blue,
    Color3FromArray,
    Color3FromArrayToRef,
    Color3FromHSV,
    Color3FromHexString,
    Color3FromInts,
    Color3Gray,
    Color3Green,
    Color3HSVtoRGBToRef,
    Color3Hermite,
    Color3Hermite1stDerivative,
    Color3Hermite1stDerivativeToRef,
    Color3Lerp,
    Color3LerpToRef,
    Color3Magenta,
    Color3Purple,
    Color3Random,
    Color3Red,
    Color3Teal,
    Color3White,
    Color3Yellow,
    Color4,
    Color4CheckColors4,
    Color4FromArray,
    Color4FromArrayToRef,
    Color4FromColor3,
    Color4FromHexString,
    Color4FromInts,
    Color4Hermite,
    Color4Hermite1stDerivative,
    Color4Hermite1stDerivativeToRef,
    Color4Lerp,
    Color4LerpToRef,
} from "./math.color.pure";
import { RegisterClass } from "../Misc/typeStore";

/*#__PURE__*/ Object.defineProperties(Color3.prototype, {
    dimension: { value: [3] },
    rank: { value: 1 },
});

/*#__PURE__*/ Object.defineProperties(Color4.prototype, {
    dimension: { value: [4] },
    rank: { value: 1 },
});

RegisterClass("BABYLON.Color3", Color3);

RegisterClass("BABYLON.Color4", Color4);

// Color3 static methods
Color3.HSVtoRGBToRef = Color3HSVtoRGBToRef;

Color3.FromHSV = Color3FromHSV;

Color3.FromHexString = Color3FromHexString;

Color3.FromArray = Color3FromArray;

Color3.FromArrayToRef = Color3FromArrayToRef;

Color3.FromInts = Color3FromInts;

Color3.Lerp = Color3Lerp;

Color3.LerpToRef = Color3LerpToRef;

Color3.Hermite = Color3Hermite;

Color3.Hermite1stDerivative = Color3Hermite1stDerivative;

Color3.Hermite1stDerivativeToRef = Color3Hermite1stDerivativeToRef;

Color3.Red = Color3Red;

Color3.Green = Color3Green;

Color3.Blue = Color3Blue;

Color3.Black = Color3Black;

Color3.White = Color3White;

Color3.Purple = Color3Purple;

Color3.Magenta = Color3Magenta;

Color3.Yellow = Color3Yellow;

Color3.Gray = Color3Gray;

Color3.Teal = Color3Teal;

Color3.Random = Color3Random;

// Color4 static methods
Color4.FromHexString = Color4FromHexString;

Color4.Lerp = Color4Lerp;

Color4.LerpToRef = Color4LerpToRef;

Color4.Hermite = Color4Hermite;

Color4.Hermite1stDerivative = Color4Hermite1stDerivative;

Color4.Hermite1stDerivativeToRef = Color4Hermite1stDerivativeToRef;

Color4.FromColor3 = Color4FromColor3;

Color4.FromArray = Color4FromArray;

Color4.FromArrayToRef = Color4FromArrayToRef;

Color4.FromInts = Color4FromInts;

Color4.CheckColors4 = Color4CheckColors4;
