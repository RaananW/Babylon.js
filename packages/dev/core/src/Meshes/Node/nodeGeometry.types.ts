export {};

declare module "./nodeGeometry.pure" {
    namespace NodeGeometry {
        export { NodeGeometryCreateDefault as CreateDefault };
        export { NodeGeometryParse as Parse };
        export { NodeGeometryParseFromSnippetAsync as ParseFromSnippetAsync };
    }
}
