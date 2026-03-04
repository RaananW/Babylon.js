/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import nodeMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./nodeMaterial.pure";

import { RegisterClass } from "../../Misc/typeStore";
import { NodeMaterial, NodeMaterialParse, NodeMaterialParseFromFileAsync, NodeMaterialParseFromSnippetAsync, NodeMaterialCreateDefault } from "./nodeMaterial.pure";

RegisterClass("BABYLON.NodeMaterial", NodeMaterial);

declare module "./nodeMaterial.pure" {
    namespace NodeMaterial {
        export let Parse: typeof NodeMaterialParse;
        export let ParseFromFileAsync: typeof NodeMaterialParseFromFileAsync;
        export let ParseFromSnippetAsync: typeof NodeMaterialParseFromSnippetAsync;
        export let CreateDefault: typeof NodeMaterialCreateDefault;
    }
}
NodeMaterial.Parse = NodeMaterialParse;
NodeMaterial.ParseFromFileAsync = NodeMaterialParseFromFileAsync;
NodeMaterial.ParseFromSnippetAsync = NodeMaterialParseFromSnippetAsync;
NodeMaterial.CreateDefault = NodeMaterialCreateDefault;
