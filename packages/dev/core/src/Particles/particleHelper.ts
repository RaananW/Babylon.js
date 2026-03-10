export * from "./particleHelper.pure";
import {
    ParticleHelper,
    ParticleHelperCreateDefault,
    ParticleHelperCreateAsync,
    ParticleHelperExportSet,
    ParticleHelperParseFromFileAsync,
    ParticleHelperParseFromSnippetAsync,
} from "./particleHelper.pure";

declare module "./particleHelper.pure" {
    namespace ParticleHelper {
        export let CreateDefault: typeof ParticleHelperCreateDefault;
        export let CreateAsync: typeof ParticleHelperCreateAsync;
        export let ExportSet: typeof ParticleHelperExportSet;
        export let ParseFromFileAsync: typeof ParticleHelperParseFromFileAsync;
        export let ParseFromSnippetAsync: typeof ParticleHelperParseFromSnippetAsync;
    }
}

ParticleHelper.CreateDefault = ParticleHelperCreateDefault;
ParticleHelper.CreateAsync = ParticleHelperCreateAsync;
ParticleHelper.ExportSet = ParticleHelperExportSet;
ParticleHelper.ParseFromFileAsync = ParticleHelperParseFromFileAsync;
ParticleHelper.ParseFromSnippetAsync = ParticleHelperParseFromSnippetAsync;
