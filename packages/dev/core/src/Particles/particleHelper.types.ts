export {};

declare module "./particleHelper.pure" {
    namespace ParticleHelper {
        export let CreateDefault: typeof ParticleHelperCreateDefault;
        export let CreateAsync: typeof ParticleHelperCreateAsync;
        export let ExportSet: typeof ParticleHelperExportSet;
        export let ParseFromFileAsync: typeof ParticleHelperParseFromFileAsync;
        export let ParseFromSnippetAsync: typeof ParticleHelperParseFromSnippetAsync;
    }
}
