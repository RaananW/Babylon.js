import { CSG, CSGFromVertexData, CSGFromMesh } from "./csg.pure";

declare module "./csg.pure" {
    namespace CSG {
        export { CSGFromVertexData as FromVertexData };
        export { CSGFromMesh as FromMesh };
    }
}

CSG.FromVertexData = CSGFromVertexData;
CSG.FromMesh = CSGFromMesh;

export * from "./csg.pure";
