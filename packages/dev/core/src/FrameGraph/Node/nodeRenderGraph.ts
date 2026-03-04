import { NodeRenderGraph, NodeRenderGraphCreateDefaultAsync, NodeRenderGraphParse, NodeRenderGraphParseFromSnippetAsync } from "./nodeRenderGraph.pure";

declare module "./nodeRenderGraph.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeRenderGraph {
        export { NodeRenderGraphCreateDefaultAsync as CreateDefaultAsync };
        export { NodeRenderGraphParse as Parse };
        export { NodeRenderGraphParseFromSnippetAsync as ParseFromSnippetAsync };
    }
}

NodeRenderGraph.CreateDefaultAsync = NodeRenderGraphCreateDefaultAsync;
NodeRenderGraph.Parse = NodeRenderGraphParse;
NodeRenderGraph.ParseFromSnippetAsync = NodeRenderGraphParseFromSnippetAsync;

export * from "./nodeRenderGraph.pure";
