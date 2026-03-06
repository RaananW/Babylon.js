/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import standardMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./standardMaterial.pure";

import { Scene } from "../scene";
import { RegisterClass } from "../Misc/typeStore";


RegisterClass("BABYLON.StandardMaterial", StandardMaterial);


Scene.DefaultMaterialFactory = (scene: Scene) => {
    return new StandardMaterial("default material", scene);
};
