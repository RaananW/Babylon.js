import { NodeGeometry, NodeGeometryCreateDefault, NodeGeometryParse, NodeGeometryParseFromSnippetAsync } from "./nodeGeometry.pure";

declare module "./nodeGeometry.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeGeometry {
        export { NodeGeometryCreateDefault as CreateDefault };
        export { NodeGeometryParse as Parse };
        export { NodeGeometryParseFromSnippetAsync as ParseFromSnippetAsync };
    }
}

NodeGeometry.CreateDefault = NodeGeometryCreateDefault;
NodeGeometry.Parse = NodeGeometryParse;
NodeGeometry.ParseFromSnippetAsync = NodeGeometryParseFromSnippetAsync;

export * from "./nodeGeometry.pure";
