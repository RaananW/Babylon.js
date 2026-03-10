/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import nodeMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./nodeMaterial.pure";

import { NodeMaterial, NodeMaterialCreateDefault, NodeMaterialParse, NodeMaterialParseFromFileAsync, NodeMaterialParseFromSnippetAsync } from "./nodeMaterial.pure";
import { RegisterClass } from "../../Misc/typeStore";

declare module "./nodeMaterial.pure" {
    namespace NodeMaterial {
        export let Parse: typeof NodeMaterialParse;
        export let ParseFromFileAsync: typeof NodeMaterialParseFromFileAsync;
        export let ParseFromSnippetAsync: typeof NodeMaterialParseFromSnippetAsync;
        export let CreateDefault: typeof NodeMaterialCreateDefault;
    }
}

RegisterClass("BABYLON.NodeMaterial", NodeMaterial);

NodeMaterial.Parse = NodeMaterialParse;

NodeMaterial.ParseFromFileAsync = NodeMaterialParseFromFileAsync;

NodeMaterial.ParseFromSnippetAsync = NodeMaterialParseFromSnippetAsync;

NodeMaterial.CreateDefault = NodeMaterialCreateDefault;
