import { NodeRenderGraph, NodeRenderGraphCreateDefaultAsync, NodeRenderGraphParse, NodeRenderGraphParseFromSnippetAsync } from "./nodeRenderGraph.pure";

declare module "./nodeRenderGraph.pure" {
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
