/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import shaderMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./shaderMaterial.pure";

import { ShaderMaterial } from "./shaderMaterial.pure";
import { RegisterClass } from "../Misc/typeStore";

RegisterClass("BABYLON.ShaderMaterial", ShaderMaterial);
