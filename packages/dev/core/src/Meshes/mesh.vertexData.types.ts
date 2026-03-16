export {};

declare module "./mesh.vertexData.pure" {
    namespace VertexData {
        export let CreateRibbon: typeof VertexDataCreateRibbon;
        export let CreateBox: typeof VertexDataCreateBox;
        export let CreateTiledBox: typeof VertexDataCreateTiledBox;
        export let CreateTiledPlane: typeof VertexDataCreateTiledPlane;
        export let CreateSphere: typeof VertexDataCreateSphere;
        export let CreateCylinder: typeof VertexDataCreateCylinder;
        export let CreateTorus: typeof VertexDataCreateTorus;
        export let CreateLineSystem: typeof VertexDataCreateLineSystem;
        export let CreateDashedLines: typeof VertexDataCreateDashedLines;
        export let CreateGround: typeof VertexDataCreateGround;
        export let CreateTiledGround: typeof VertexDataCreateTiledGround;
        export let CreateGroundFromHeightMap: typeof VertexDataCreateGroundFromHeightMap;
        export let CreatePlane: typeof VertexDataCreatePlane;
        export let CreateDisc: typeof VertexDataCreateDisc;
        export let CreatePolygon: typeof VertexDataCreatePolygon;
        export let CreateIcoSphere: typeof VertexDataCreateIcoSphere;
        export let CreatePolyhedron: typeof VertexDataCreatePolyhedron;
        export let CreateCapsule: typeof VertexDataCreateCapsule;
        export let CreateTorusKnot: typeof VertexDataCreateTorusKnot;
        export let ComputeNormals: typeof VertexDataComputeNormals;
        export let _ComputeSides: typeof VertexData_ComputeSides;
        export let Parse: typeof VertexDataParse;
        export let ImportVertexData: typeof VertexDataImportVertexData;
    }
}
