export {};

declare module "./nodeRenderGraph.pure" {
    namespace NodeRenderGraph {
        export { NodeRenderGraphCreateDefaultAsync as CreateDefaultAsync };
        export { NodeRenderGraphParse as Parse };
        export { NodeRenderGraphParseFromSnippetAsync as ParseFromSnippetAsync };
    }
}
