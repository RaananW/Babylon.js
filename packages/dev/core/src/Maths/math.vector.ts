/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import math.vector.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./math.vector.pure";

import { Matrix, Quaternion, Vector2, Vector3, Vector4 } from "./math.vector.pure";
import { RegisterClass } from "../Misc/typeStore";

/*#__PURE__*/ Object.defineProperties(Vector2.prototype, {
    dimension: { value: [2] },
    rank: { value: 1 },
});

/*#__PURE__*/ Object.defineProperties(Vector3.prototype, {
    dimension: { value: [3] },
    rank: { value: 1 },
});

/*#__PURE__*/ Object.defineProperties(Vector4.prototype, {
    dimension: { value: [4] },
    rank: { value: 1 },
});

/*#__PURE__*/ Object.defineProperties(Quaternion.prototype, {
    dimension: { value: [4] },
    rank: { value: 1 },
});

/*#__PURE__*/ Object.defineProperties(Matrix.prototype, {
    dimension: { value: [4, 4] },
    rank: { value: 2 },
});

RegisterClass("BABYLON.Vector2", Vector2);

RegisterClass("BABYLON.Vector3", Vector3);

RegisterClass("BABYLON.Vector4", Vector4);

RegisterClass("BABYLON.Matrix", Matrix);
