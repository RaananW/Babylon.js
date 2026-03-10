/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import mesh.vertexData.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./mesh.vertexData.pure";

import {
    VertexData,
    VertexDataComputeNormals,
    VertexDataCreateBox,
    VertexDataCreateCapsule,
    VertexDataCreateCylinder,
    VertexDataCreateDashedLines,
    VertexDataCreateDisc,
    VertexDataCreateGround,
    VertexDataCreateGroundFromHeightMap,
    VertexDataCreateIcoSphere,
    VertexDataCreateLineSystem,
    VertexDataCreatePlane,
    VertexDataCreatePolygon,
    VertexDataCreatePolyhedron,
    VertexDataCreateRibbon,
    VertexDataCreateSphere,
    VertexDataCreateTiledBox,
    VertexDataCreateTiledGround,
    VertexDataCreateTiledPlane,
    VertexDataCreateTorus,
    VertexDataCreateTorusKnot,
    VertexDataImportVertexData,
    VertexDataParse,
    VertexData_ComputeSides,
} from "./mesh.vertexData.pure";

declare module "./mesh.vertexData.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
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

VertexData.CreateRibbon = VertexDataCreateRibbon;

VertexData.CreateBox = VertexDataCreateBox;

VertexData.CreateTiledBox = VertexDataCreateTiledBox;

VertexData.CreateTiledPlane = VertexDataCreateTiledPlane;

VertexData.CreateSphere = VertexDataCreateSphere;

VertexData.CreateCylinder = VertexDataCreateCylinder;

VertexData.CreateTorus = VertexDataCreateTorus;

VertexData.CreateLineSystem = VertexDataCreateLineSystem;

VertexData.CreateDashedLines = VertexDataCreateDashedLines;

VertexData.CreateGround = VertexDataCreateGround;

VertexData.CreateTiledGround = VertexDataCreateTiledGround;

VertexData.CreateGroundFromHeightMap = VertexDataCreateGroundFromHeightMap;

VertexData.CreatePlane = VertexDataCreatePlane;

VertexData.CreateDisc = VertexDataCreateDisc;

VertexData.CreatePolygon = VertexDataCreatePolygon;

VertexData.CreateIcoSphere = VertexDataCreateIcoSphere;

VertexData.CreatePolyhedron = VertexDataCreatePolyhedron;

VertexData.CreateCapsule = VertexDataCreateCapsule;

VertexData.CreateTorusKnot = VertexDataCreateTorusKnot;

VertexData.ComputeNormals = VertexDataComputeNormals;

VertexData._ComputeSides = VertexData_ComputeSides;

VertexData.Parse = VertexDataParse;

VertexData.ImportVertexData = VertexDataImportVertexData;
