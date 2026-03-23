export {};

declare module "./nodeMaterial.pure" {
    namespace NodeMaterial {
        export let Parse: typeof NodeMaterialParse;
        export let ParseFromFileAsync: typeof NodeMaterialParseFromFileAsync;
        export let ParseFromSnippetAsync: typeof NodeMaterialParseFromSnippetAsync;
        export let CreateDefault: typeof NodeMaterialCreateDefault;
    }
}
