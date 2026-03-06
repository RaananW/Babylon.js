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
