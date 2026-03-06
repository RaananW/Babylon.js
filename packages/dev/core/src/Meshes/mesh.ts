/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import mesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./mesh.pure";

import {
    Mesh,
    MeshCenter,
    MeshCreateBox,
    MeshCreateCapsule,
    MeshCreateCylinder,
    MeshCreateDashedLines,
    MeshCreateDecal,
    MeshCreateDisc,
    MeshCreateGround,
    MeshCreateGroundFromHeightMap,
    MeshCreateHemisphere,
    MeshCreateIcoSphere,
    MeshCreateLathe,
    MeshCreateLines,
    MeshCreatePlane,
    MeshCreatePolygon,
    MeshCreatePolyhedron,
    MeshCreateRibbon,
    MeshCreateSphere,
    MeshCreateTiledGround,
    MeshCreateTorus,
    MeshCreateTorusKnot,
    MeshCreateTube,
    MeshExtendToGoldberg,
    MeshExtrudePolygon,
    MeshExtrudeShape,
    MeshExtrudeShapeCustom,
    MeshMinMax,
    Mesh_GetDefaultSideOrientation,
} from "./mesh.pure";
import { RegisterClass } from "../Misc/typeStore";

Mesh._GetDefaultSideOrientation = Mesh_GetDefaultSideOrientation;

Mesh.MinMax = MeshMinMax;

Mesh.Center = MeshCenter;

Mesh.CreateRibbon = MeshCreateRibbon;

Mesh.CreateDisc = MeshCreateDisc;

Mesh.CreateBox = MeshCreateBox;

Mesh.CreateSphere = MeshCreateSphere;

Mesh.CreateHemisphere = MeshCreateHemisphere;

Mesh.CreateCylinder = MeshCreateCylinder;

Mesh.CreateTorus = MeshCreateTorus;

Mesh.CreateTorusKnot = MeshCreateTorusKnot;

Mesh.CreateLines = MeshCreateLines;

Mesh.CreateDashedLines = MeshCreateDashedLines;

Mesh.CreatePolygon = MeshCreatePolygon;

Mesh.ExtrudePolygon = MeshExtrudePolygon;

Mesh.ExtrudeShape = MeshExtrudeShape;

Mesh.ExtrudeShapeCustom = MeshExtrudeShapeCustom;

Mesh.CreateLathe = MeshCreateLathe;

Mesh.CreatePlane = MeshCreatePlane;

Mesh.CreateGround = MeshCreateGround;

Mesh.CreateTiledGround = MeshCreateTiledGround;

Mesh.CreateGroundFromHeightMap = MeshCreateGroundFromHeightMap;

Mesh.CreateTube = MeshCreateTube;

Mesh.CreatePolyhedron = MeshCreatePolyhedron;

Mesh.CreateIcoSphere = MeshCreateIcoSphere;

Mesh.CreateDecal = MeshCreateDecal;

Mesh.CreateCapsule = MeshCreateCapsule;

Mesh.ExtendToGoldberg = MeshExtendToGoldberg;

RegisterClass("BABYLON.Mesh", Mesh);
