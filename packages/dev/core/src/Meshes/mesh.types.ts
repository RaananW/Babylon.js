export {};

declare module "./mesh.pure" {
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
