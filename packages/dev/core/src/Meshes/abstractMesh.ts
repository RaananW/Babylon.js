/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractMesh.pure";

import { AbstractMesh } from "./abstractMesh.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.AbstractMesh", AbstractMesh);
