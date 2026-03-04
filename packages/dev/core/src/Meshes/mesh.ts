/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import mesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./mesh.pure";

import { RegisterClass } from "../Misc/typeStore";
import {
    Mesh,
    Mesh_GetDefaultSideOrientation,
    MeshMinMax,
    MeshCenter,
    MeshCreateRibbon,
    MeshCreateDisc,
    MeshCreateBox,
    MeshCreateSphere,
    MeshCreateHemisphere,
    MeshCreateCylinder,
    MeshCreateTorus,
    MeshCreateTorusKnot,
    MeshCreateLines,
    MeshCreateDashedLines,
    MeshCreatePolygon,
    MeshExtrudePolygon,
    MeshExtrudeShape,
    MeshExtrudeShapeCustom,
    MeshCreateLathe,
    MeshCreatePlane,
    MeshCreateGround,
    MeshCreateTiledGround,
    MeshCreateGroundFromHeightMap,
    MeshCreateTube,
    MeshCreatePolyhedron,
    MeshCreateIcoSphere,
    MeshCreateDecal,
    MeshCreateCapsule,
    MeshExtendToGoldberg,
} from "./mesh.pure";

declare module "./mesh" {
    namespace Mesh {
        export let _GetDefaultSideOrientation: typeof Mesh_GetDefaultSideOrientation;
        export let MinMax: typeof MeshMinMax;
        export let Center: typeof MeshCenter;
        export let CreateRibbon: typeof MeshCreateRibbon;
        export let CreateDisc: typeof MeshCreateDisc;
        export let CreateBox: typeof MeshCreateBox;
        export let CreateSphere: typeof MeshCreateSphere;
        export let CreateHemisphere: typeof MeshCreateHemisphere;
        export let CreateCylinder: typeof MeshCreateCylinder;
        export let CreateTorus: typeof MeshCreateTorus;
        export let CreateTorusKnot: typeof MeshCreateTorusKnot;
        export let CreateLines: typeof MeshCreateLines;
        export let CreateDashedLines: typeof MeshCreateDashedLines;
        export let CreatePolygon: typeof MeshCreatePolygon;
        export let ExtrudePolygon: typeof MeshExtrudePolygon;
        export let ExtrudeShape: typeof MeshExtrudeShape;
        export let ExtrudeShapeCustom: typeof MeshExtrudeShapeCustom;
        export let CreateLathe: typeof MeshCreateLathe;
        export let CreatePlane: typeof MeshCreatePlane;
        export let CreateGround: typeof MeshCreateGround;
        export let CreateTiledGround: typeof MeshCreateTiledGround;
        export let CreateGroundFromHeightMap: typeof MeshCreateGroundFromHeightMap;
        export let CreateTube: typeof MeshCreateTube;
        export let CreatePolyhedron: typeof MeshCreatePolyhedron;
        export let CreateIcoSphere: typeof MeshCreateIcoSphere;
        export let CreateDecal: typeof MeshCreateDecal;
        export let CreateCapsule: typeof MeshCreateCapsule;
        export let ExtendToGoldberg: typeof MeshExtendToGoldberg;
    }
}

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
