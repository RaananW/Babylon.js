import { NodeParticleSystemSet, NodeParticleSystemSetCreateDefault, NodeParticleSystemSetParse, NodeParticleSystemSetParseFromFileAsync, NodeParticleSystemSetParseFromSnippetAsync } from "./nodeParticleSystemSet.pure";

declare module "./nodeParticleSystemSet.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeParticleSystemSet {
        export { NodeParticleSystemSetCreateDefault as CreateDefault };
        export { NodeParticleSystemSetParse as Parse };
        export { NodeParticleSystemSetParseFromFileAsync as ParseFromFileAsync };
        export { NodeParticleSystemSetParseFromSnippetAsync as ParseFromSnippetAsync };
    }
}

NodeParticleSystemSet.CreateDefault = NodeParticleSystemSetCreateDefault;
NodeParticleSystemSet.Parse = NodeParticleSystemSetParse;
NodeParticleSystemSet.ParseFromFileAsync = NodeParticleSystemSetParseFromFileAsync;
NodeParticleSystemSet.ParseFromSnippetAsync = NodeParticleSystemSetParseFromSnippetAsync;

export * from "./nodeParticleSystemSet.pure";
