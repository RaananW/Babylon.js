/**
 * Re-exports all pure math.color types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import math.color.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./math.color.pure";

import { RegisterClass } from "../Misc/typeStore";
import {
    Color3,
    Color4,
    Color3FromHSV,
    Color3FromHexString,
    Color3FromArray,
    Color3FromArrayToRef,
    Color3FromInts,
    Color3Lerp,
    Color3Hermite,
    Color3Hermite1stDerivative,
    Color3Hermite1stDerivativeToRef,
    Color3Red,
    Color3Green,
    Color3Blue,
    Color3Black,
    Color3White,
    Color3Purple,
    Color3Magenta,
    Color3Yellow,
    Color3Gray,
    Color3Teal,
    Color3Random,
    Color4FromHexString,
    Color4Lerp,
    Color4Hermite,
    Color4Hermite1stDerivative,
    Color4Hermite1stDerivativeToRef,
    Color4FromColor3,
    Color4FromArray,
    Color4FromArrayToRef,
    Color4FromInts,
    Color4CheckColors4,
} from "./math.color.pure";
import { Color3HSVtoRGBToRef, Color3LerpToRef, Color4LerpToRef } from "./math.color.functions";

RegisterClass("BABYLON.Color3", Color3);
RegisterClass("BABYLON.Color4", Color4);

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
