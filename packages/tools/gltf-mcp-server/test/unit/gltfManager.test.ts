/**
 * glTF MCP Server – GltfManager Unit Tests
 *
 * Tests for lifecycle, inspection, editing, validation, and export operations.
 */

import { GltfManager } from "../../src/gltfManager";

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function createManagerWithDoc(name = "test"): GltfManager {
    const mgr = new GltfManager();
    mgr.createGltf(name);
    return mgr;
}

const SAMPLE_GLTF = JSON.stringify({
    asset: { version: "2.0", generator: "test" },
    scene: 0,
    scenes: [{ name: "MainScene", nodes: [0, 1] }],
    nodes: [
        { name: "Root", children: [2] },
        { name: "Camera", camera: 0 },
        { name: "Child", mesh: 0, translation: [1, 2, 3] },
    ],
    meshes: [
        {
            name: "Box",
            primitives: [{ attributes: { POSITION: 0 }, material: 0 }],
        },
    ],
    materials: [
        {
            name: "Red",
            pbrMetallicRoughness: {
                baseColorFactor: [1, 0, 0, 1],
                metallicFactor: 0.5,
                roughnessFactor: 0.8,
            },
        },
    ],
    textures: [{ source: 0, sampler: 0 }],
    images: [{ uri: "texture.png", mimeType: "image/png" }],
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
    accessors: [{ componentType: 5126, count: 24, type: "VEC3" }],
    bufferViews: [],
    buffers: [],
    animations: [
        {
            name: "Anim1",
            channels: [{ sampler: 0, target: { node: 0, path: "translation" } }],
            samplers: [{ input: 0, output: 0, interpolation: "LINEAR" }],
        },
    ],
    skins: [],
    cameras: [{ name: "Cam1", type: "perspective", perspective: { yfov: 0.7, znear: 0.1 } }],
    extensionsUsed: ["KHR_materials_unlit"],
    extensionsRequired: [],
});

/* ================================================================== */
/*  Lifecycle                                                          */
/* ================================================================== */

describe("GltfManager — Lifecycle", () => {
    it("creates a minimal valid document", () => {
        const mgr = new GltfManager();
        const result = mgr.createGltf("doc1");
        expect(result).toContain("doc1");
        expect(result).toContain("2.0");
    });

    it("rejects duplicate names", () => {
        const mgr = createManagerWithDoc("a");
        const result = mgr.createGltf("a");
        expect(result).toContain("Error");
    });

    it("loads from JSON text", () => {
        const mgr = new GltfManager();
        const result = mgr.loadGltf("loaded", SAMPLE_GLTF);
        expect(result).toContain("loaded");
        expect(result).toContain("3"); // 3 nodes
    });

    it("rejects invalid JSON on load", () => {
        const mgr = new GltfManager();
        expect(mgr.loadGltf("bad", "not json")).toContain("Error");
    });

    it("rejects missing asset.version", () => {
        const mgr = new GltfManager();
        expect(mgr.loadGltf("bad", JSON.stringify({ something: true }))).toContain("Error");
    });

    it("lists all documents", () => {
        const mgr = new GltfManager();
        mgr.createGltf("a");
        mgr.createGltf("b");
        const list = mgr.listGltfs();
        expect(list).toContain("a");
        expect(list).toContain("b");
    });

    it("lists empty state", () => {
        const mgr = new GltfManager();
        expect(mgr.listGltfs()).toContain("No glTF");
    });

    it("deletes a document", () => {
        const mgr = createManagerWithDoc("x");
        expect(mgr.deleteGltf("x")).toContain("Deleted");
        expect(mgr.deleteGltf("x")).toContain("Error");
    });

    it("clones a document", () => {
        const mgr = new GltfManager();
        mgr.loadGltf("orig", SAMPLE_GLTF);
        const result = mgr.cloneGltf("orig", "copy");
        expect(result).toContain("copy");
        // Verify independence
        mgr.addNode("copy", "NewNode");
        const origNodes = mgr.listNodes("orig");
        const copyNodes = mgr.listNodes("copy");
        expect(copyNodes).toContain("NewNode");
        expect(origNodes).not.toContain("NewNode");
    });

    it("clone rejects nonexistent source", () => {
        const mgr = new GltfManager();
        expect(mgr.cloneGltf("nope", "copy")).toContain("Error");
    });
});

/* ================================================================== */
/*  Inspection                                                         */
/* ================================================================== */

describe("GltfManager — Inspection", () => {
    let mgr: GltfManager;

    beforeEach(() => {
        mgr = new GltfManager();
        mgr.loadGltf("doc", SAMPLE_GLTF);
    });

    it("describes a document with counts and metadata", () => {
        const desc = mgr.describeGltf("doc");
        expect(desc).toContain("Nodes**: 3");
        expect(desc).toContain("Meshes**: 1");
        expect(desc).toContain("Materials**: 1");
        expect(desc).toContain("KHR_materials_unlit");
    });

    it("describes a scene", () => {
        const desc = mgr.describeScene("doc", 0);
        expect(desc).toContain("MainScene");
        expect(desc).toContain("Root nodes**: 2");
    });

    it("describes a node", () => {
        const desc = mgr.describeNode("doc", 2);
        expect(desc).toContain("Child");
        expect(desc).toContain("Translation");
        expect(desc).toContain("Mesh**: 0");
    });

    it("describes a mesh", () => {
        const desc = mgr.describeMesh("doc", 0);
        expect(desc).toContain("Box");
        expect(desc).toContain("POSITION");
    });

    it("describes a material", () => {
        const desc = mgr.describeMaterial("doc", 0);
        expect(desc).toContain("Red");
        expect(desc).toContain("metallicFactor: 0.5");
        expect(desc).toContain("roughnessFactor: 0.8");
    });

    it("describes an animation", () => {
        const desc = mgr.describeAnimation("doc", 0);
        expect(desc).toContain("Anim1");
        expect(desc).toContain("translation");
    });

    it("describes a texture", () => {
        const desc = mgr.describeTexture("doc", 0);
        expect(desc).toContain("texture.png");
    });

    it("describes an image", () => {
        const desc = mgr.describeImage("doc", 0);
        expect(desc).toContain("texture.png");
        expect(desc).toContain("image/png");
    });

    it("describes an accessor", () => {
        const desc = mgr.describeAccessor("doc", 0);
        expect(desc).toContain("VEC3");
        expect(desc).toContain("5126");
    });

    it("describes a sampler", () => {
        const desc = mgr.describeSampler("doc", 0);
        expect(desc).toContain("9729");
    });

    it("returns error for invalid indices", () => {
        expect(mgr.describeScene("doc", 99)).toContain("Error");
        expect(mgr.describeNode("doc", 99)).toContain("Error");
        expect(mgr.describeMesh("doc", 99)).toContain("Error");
        expect(mgr.describeMaterial("doc", 99)).toContain("Error");
    });

    it("returns error for nonexistent document", () => {
        expect(mgr.describeGltf("nope")).toContain("Error");
    });
});

/* ================================================================== */
/*  List operations                                                    */
/* ================================================================== */

describe("GltfManager — Lists", () => {
    let mgr: GltfManager;

    beforeEach(() => {
        mgr = new GltfManager();
        mgr.loadGltf("doc", SAMPLE_GLTF);
    });

    it("lists scenes", () => {
        const list = mgr.listScenes("doc");
        expect(list).toContain("MainScene");
        expect(list).toContain("[active]");
    });

    it("lists nodes", () => {
        const list = mgr.listNodes("doc");
        expect(list).toContain("Root");
        expect(list).toContain("Child");
    });

    it("lists meshes", () => {
        expect(mgr.listMeshes("doc")).toContain("Box");
    });

    it("lists materials", () => {
        expect(mgr.listMaterials("doc")).toContain("Red");
    });

    it("lists animations", () => {
        expect(mgr.listAnimations("doc")).toContain("Anim1");
    });

    it("lists textures", () => {
        expect(mgr.listTextures("doc")).toContain("source=0");
    });

    it("lists extensions", () => {
        const ext = mgr.listExtensions("doc");
        expect(ext).toContain("KHR_materials_unlit");
    });
});

/* ================================================================== */
/*  Node & Scene editing                                               */
/* ================================================================== */

describe("GltfManager — Node & Scene Editing", () => {
    let mgr: GltfManager;

    beforeEach(() => {
        mgr = createManagerWithDoc("doc");
    });

    it("adds a scene", () => {
        expect(mgr.addScene("doc", "NewScene")).toContain("NewScene");
        expect(mgr.listScenes("doc")).toContain("NewScene");
    });

    it("renames a scene", () => {
        expect(mgr.renameScene("doc", 0, "Renamed")).toContain("Renamed");
    });

    it("sets active scene", () => {
        mgr.addScene("doc", "Second");
        expect(mgr.setActiveScene("doc", 1)).toContain("Second");
    });

    it("adds a node to scene root", () => {
        const result = mgr.addNode("doc", "MyNode");
        expect(result).toContain("MyNode");
        expect(mgr.listNodes("doc")).toContain("MyNode");
    });

    it("adds a child node", () => {
        mgr.addNode("doc", "Parent");
        const result = mgr.addChildNode("doc", 0, "Child");
        expect(result).toContain("Child");
        const desc = mgr.describeNode("doc", 0);
        expect(desc).toContain("1"); // child index
    });

    it("renames a node", () => {
        mgr.addNode("doc", "OldName");
        expect(mgr.renameNode("doc", 0, "NewName")).toContain("NewName");
    });

    it("sets TRS transform", () => {
        mgr.addNode("doc", "N");
        const result = mgr.setNodeTransform("doc", 0, [1, 2, 3], [0, 0, 0, 1], [1, 1, 1]);
        expect(result).toContain("Updated transform");
        expect(mgr.describeNode("doc", 0)).toContain("[1, 2, 3]");
    });

    it("sets matrix and clears TRS", () => {
        mgr.addNode("doc", "N");
        mgr.setNodeTransform("doc", 0, [1, 0, 0]);
        const matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        mgr.setNodeMatrix("doc", 0, matrix);
        const desc = mgr.describeNode("doc", 0);
        expect(desc).toContain("Matrix");
        expect(desc).not.toContain("Translation");
    });

    it("clears transform", () => {
        mgr.addNode("doc", "N");
        mgr.setNodeTransform("doc", 0, [1, 1, 1]);
        mgr.clearNodeTransform("doc", 0);
        const desc = mgr.describeNode("doc", 0);
        expect(desc).not.toContain("Translation");
        expect(desc).not.toContain("Matrix");
    });

    it("reparents a node", () => {
        mgr.addNode("doc", "A");
        mgr.addNode("doc", "B");
        mgr.reparentNode("doc", 1, 0);
        expect(mgr.describeNode("doc", 0)).toContain("1");
    });

    it("prevents cycle on reparent", () => {
        mgr.addNode("doc", "Parent");
        mgr.addNode("doc", "Child", 0);
        const result = mgr.reparentNode("doc", 0, 1);
        expect(result).toContain("cycle");
    });

    it("removes a node", () => {
        mgr.addNode("doc", "ToRemove");
        const result = mgr.removeNode("doc", 0);
        expect(result).toContain("Removed");
    });
});

/* ================================================================== */
/*  Mesh editing                                                       */
/* ================================================================== */

describe("GltfManager — Mesh Editing", () => {
    let mgr: GltfManager;

    beforeEach(() => {
        mgr = createManagerWithDoc("doc");
    });

    it("adds and removes a mesh", () => {
        expect(mgr.addMesh("doc", "MyMesh")).toContain("MyMesh");
        expect(mgr.listMeshes("doc")).toContain("MyMesh");
        expect(mgr.removeMesh("doc", 0)).toContain("Removed");
    });

    it("assigns mesh to node", () => {
        mgr.addNode("doc", "N");
        mgr.addMesh("doc", "M");
        expect(mgr.assignMeshToNode("doc", 0, 0)).toContain("Assigned");
        expect(mgr.describeNode("doc", 0)).toContain("Mesh**: 0");
    });

    it("unassigns mesh from node", () => {
        mgr.addNode("doc", "N");
        mgr.addMesh("doc", "M");
        mgr.assignMeshToNode("doc", 0, 0);
        mgr.unassignMeshFromNode("doc", 0);
        expect(mgr.describeNode("doc", 0)).not.toContain("Mesh**: 0");
    });

    it("sets and removes primitive material", () => {
        mgr.addMesh("doc", "M");
        mgr.addMaterial("doc", "Mat");
        expect(mgr.setPrimitiveMaterial("doc", 0, 0, 0)).toContain("Set material");
        expect(mgr.removePrimitiveMaterial("doc", 0, 0)).toContain("Removed material");
    });
});

/* ================================================================== */
/*  Material editing                                                   */
/* ================================================================== */

describe("GltfManager — Material Editing", () => {
    let mgr: GltfManager;

    beforeEach(() => {
        mgr = createManagerWithDoc("doc");
        mgr.addMaterial("doc", "TestMat");
    });

    it("adds a material with defaults", () => {
        expect(mgr.describeMaterial("doc", 0)).toContain("TestMat");
        expect(mgr.describeMaterial("doc", 0)).toContain("metallicFactor: 1");
    });

    it("sets PBR properties", () => {
        mgr.setMaterialPbr("doc", 0, [0.5, 0.5, 0.5, 1], 0.2, 0.9);
        const desc = mgr.describeMaterial("doc", 0);
        expect(desc).toContain("0.5, 0.5, 0.5, 1");
        expect(desc).toContain("metallicFactor: 0.2");
        expect(desc).toContain("roughnessFactor: 0.9");
    });

    it("renames a material", () => {
        expect(mgr.renameMaterial("doc", 0, "NewName")).toContain("NewName");
    });

    it("sets alpha mode", () => {
        mgr.setMaterialAlphaMode("doc", 0, "BLEND");
        expect(mgr.describeMaterial("doc", 0)).toContain("BLEND");
    });

    it("rejects invalid alpha mode", () => {
        expect(mgr.setMaterialAlphaMode("doc", 0, "INVALID")).toContain("Error");
    });

    it("sets double-sided", () => {
        mgr.setMaterialDoubleSided("doc", 0, true);
        expect(mgr.describeMaterial("doc", 0)).toContain("doubleSided**: true");
    });

    it("sets emissive properties", () => {
        mgr.setMaterialEmissive("doc", 0, [1, 0.5, 0]);
        expect(mgr.describeMaterial("doc", 0)).toContain("1, 0.5, 0");
    });

    it("removes a material and clears references", () => {
        mgr.addMesh("doc", "M");
        mgr.setPrimitiveMaterial("doc", 0, 0, 0);
        mgr.removeMaterial("doc", 0);
        expect(mgr.describeMesh("doc", 0)).toContain("material=none");
    });
});

/* ================================================================== */
/*  Texture / Image / Sampler                                          */
/* ================================================================== */

describe("GltfManager — Texture/Image/Sampler", () => {
    let mgr: GltfManager;

    beforeEach(() => {
        mgr = createManagerWithDoc("doc");
    });

    it("adds and removes an image", () => {
        expect(mgr.addImageReference("doc", "image.png", "MyImg")).toContain("MyImg");
        expect(mgr.removeImage("doc", 0)).toContain("Removed");
    });

    it("adds and removes a texture", () => {
        mgr.addImageReference("doc", "img.png");
        expect(mgr.addTexture("doc", 0, undefined, "Tex1")).toContain("Tex1");
        expect(mgr.removeTexture("doc", 0)).toContain("Removed");
    });

    it("sets texture sampler", () => {
        mgr.addImageReference("doc", "img.png");
        mgr.addTexture("doc", 0);
        mgr.addSampler("doc", 9729, 9987);
        expect(mgr.setTextureSampler("doc", 0, 0)).toContain("Set sampler");
    });

    it("adds and removes a sampler", () => {
        expect(mgr.addSampler("doc", 9729, 9987, 10497, 10497, "MySampler")).toContain("MySampler");
        expect(mgr.removeSampler("doc", 0)).toContain("Removed");
    });

    it("assigns texture to material slot", () => {
        mgr.addMaterial("doc", "Mat");
        mgr.addImageReference("doc", "img.png");
        mgr.addTexture("doc", 0);
        expect(mgr.setMaterialTexture("doc", 0, "baseColorTexture", 0)).toContain("Assigned texture");
        expect(mgr.describeMaterial("doc", 0)).toContain("baseColorTexture");
    });

    it("rejects invalid texture slot", () => {
        mgr.addMaterial("doc", "Mat");
        mgr.addImageReference("doc", "img.png");
        mgr.addTexture("doc", 0);
        expect(mgr.setMaterialTexture("doc", 0, "invalidSlot", 0)).toContain("Error");
    });
});

/* ================================================================== */
/*  Animation / Skin                                                   */
/* ================================================================== */

describe("GltfManager — Animation/Skin", () => {
    let mgr: GltfManager;

    beforeEach(() => {
        mgr = new GltfManager();
        mgr.loadGltf("doc", SAMPLE_GLTF);
    });

    it("lists animation channels", () => {
        const list = mgr.listAnimationChannels("doc", 0);
        expect(list).toContain("translation");
        expect(list).toContain("node=0");
    });

    it("describes an animation channel", () => {
        const desc = mgr.describeAnimationChannel("doc", 0, 0);
        expect(desc).toContain("translation");
        expect(desc).toContain("LINEAR");
    });

    it("renames an animation", () => {
        expect(mgr.renameAnimation("doc", 0, "WalkCycle")).toContain("WalkCycle");
    });

    it("removes an animation", () => {
        expect(mgr.removeAnimation("doc", 0)).toContain("Removed");
    });
});

/* ================================================================== */
/*  Extension handling                                                 */
/* ================================================================== */

describe("GltfManager — Extensions", () => {
    let mgr: GltfManager;

    beforeEach(() => {
        mgr = createManagerWithDoc("doc");
        mgr.addNode("doc", "TestNode");
        mgr.addMaterial("doc", "TestMat");
    });

    it("sets and gets root extension data", () => {
        mgr.setExtensionData("doc", "KHR_test", { value: 42 }, "root");
        const data = mgr.getExtensionData("doc", "KHR_test", "root");
        expect(data).toContain("42");
    });

    it("sets and gets node extension data", () => {
        mgr.setExtensionData("doc", "KHR_test", { mode: "fast" }, "node", 0);
        const data = mgr.getExtensionData("doc", "KHR_test", "node", 0);
        expect(data).toContain("fast");
    });

    it("sets and gets material extension data", () => {
        mgr.setExtensionData("doc", "KHR_materials_unlit", {}, "material", 0);
        const data = mgr.getExtensionData("doc", "KHR_materials_unlit", "material", 0);
        expect(data).toBe("{}");
    });

    it("removes extension data", () => {
        mgr.setExtensionData("doc", "KHR_test", { a: 1 }, "root");
        expect(mgr.removeExtensionData("doc", "KHR_test", "root")).toContain("Removed");
        expect(mgr.getExtensionData("doc", "KHR_test", "root")).toContain("No extension");
    });

    it("adds to extensionsUsed and extensionsRequired", () => {
        mgr.addExtensionToUsed("doc", "KHR_test");
        expect(mgr.listExtensions("doc")).toContain("KHR_test");

        mgr.addExtensionToRequired("doc", "KHR_test");
        expect(mgr.listExtensions("doc")).toContain("extensionsRequired");
    });

    it("removes from extensionsUsed", () => {
        mgr.addExtensionToUsed("doc", "KHR_test");
        mgr.removeExtensionFromUsed("doc", "KHR_test");
        expect(mgr.listExtensions("doc")).toContain("No extensions");
    });

    it("removes from extensionsRequired only", () => {
        mgr.addExtensionToRequired("doc", "KHR_test");
        mgr.removeExtensionFromRequired("doc", "KHR_test");
        const ext = mgr.listExtensions("doc");
        expect(ext).toContain("KHR_test"); // still in used
        expect(ext).not.toContain("extensionsRequired");
    });

    it("returns error for invalid target", () => {
        expect(mgr.getExtensionData("doc", "test", "node", 99)).toContain("Error");
    });
});

/* ================================================================== */
/*  Validation                                                         */
/* ================================================================== */

describe("GltfManager — Validation", () => {
    it("validates a clean document with no issues", () => {
        const mgr = createManagerWithDoc("doc");
        const issues = mgr.validateGltf("doc");
        expect(issues.length).toBe(1);
        expect(issues[0].severity).toBe("info");
        expect(issues[0].message).toContain("No issues");
    });

    it("detects broken node mesh reference", () => {
        const mgr = createManagerWithDoc("doc");
        mgr.addNode("doc", "N");
        // Manually set a bogus mesh reference
        const doc = mgr._getDocumentForTest("doc")!;
        doc.nodes![0].mesh = 99;
        const issues = mgr.validateGltf("doc");
        expect(issues.some((i) => i.severity === "error" && i.message.includes("mesh"))).toBe(true);
    });

    it("detects broken scene node reference", () => {
        const mgr = createManagerWithDoc("doc");
        const doc = mgr._getDocumentForTest("doc")!;
        doc.scenes![0].nodes = [99];
        const issues = mgr.validateGltf("doc");
        expect(issues.some((i) => i.severity === "error" && i.message.includes("node"))).toBe(true);
    });

    it("detects broken material texture reference", () => {
        const mgr = createManagerWithDoc("doc");
        mgr.addMaterial("doc", "M");
        const doc = mgr._getDocumentForTest("doc")!;
        doc.materials![0].pbrMetallicRoughness!.baseColorTexture = { index: 99 };
        const issues = mgr.validateGltf("doc");
        expect(issues.some((i) => i.severity === "error" && i.message.includes("texture"))).toBe(true);
    });

    it("warns about extensions used but not declared", () => {
        const mgr = createManagerWithDoc("doc");
        mgr.setExtensionData("doc", "KHR_test", { a: 1 }, "root");
        const issues = mgr.validateGltf("doc");
        expect(issues.some((i) => i.severity === "warning" && i.message.includes("extensionsUsed"))).toBe(true);
    });

    it("warns about duplicate names", () => {
        const mgr = createManagerWithDoc("doc");
        mgr.addNode("doc", "Same");
        mgr.addNode("doc", "Same");
        const issues = mgr.validateGltf("doc");
        expect(issues.some((i) => i.severity === "warning" && i.message.includes("Duplicate"))).toBe(true);
    });

    it("summarizes issues", () => {
        const mgr = createManagerWithDoc("doc");
        const doc = mgr._getDocumentForTest("doc")!;
        doc.scenes![0].nodes = [99];
        const issues = mgr.validateGltf("doc");
        const summary = mgr.summarizeIssues(issues);
        expect(summary).toContain("Errors: ");
        expect(summary).toContain("ERROR");
    });
});

/* ================================================================== */
/*  Export / Import                                                     */
/* ================================================================== */

describe("GltfManager — Export/Import", () => {
    it("exports valid JSON", () => {
        const mgr = createManagerWithDoc("doc");
        mgr.addNode("doc", "TestNode");
        const json = mgr.exportJson("doc");
        expect(json).toBeTruthy();
        const parsed = JSON.parse(json!);
        expect(parsed.asset.version).toBe("2.0");
        expect(parsed.nodes.length).toBe(1);
    });

    it("returns null for nonexistent document", () => {
        const mgr = new GltfManager();
        expect(mgr.exportJson("nope")).toBeNull();
    });

    it("round-trips through export and import", () => {
        const mgr = new GltfManager();
        mgr.loadGltf("orig", SAMPLE_GLTF);
        const exported = mgr.exportJson("orig")!;
        mgr.loadGltf("reimported", exported);
        const desc = mgr.describeGltf("reimported");
        expect(desc).toContain("Nodes**: 3");
        expect(desc).toContain("Materials**: 1");
    });

    it("exports GLB buffer", () => {
        const mgr = createManagerWithDoc("doc");
        mgr.addNode("doc", "N");
        const glb = mgr.exportGlb("doc");
        expect(glb).toBeTruthy();
        expect(glb!.length).toBeGreaterThan(12);
        // Check magic number
        expect(glb!.readUInt32LE(0)).toBe(0x46546c67); // "glTF"
        expect(glb!.readUInt32LE(4)).toBe(2); // version 2
    });

    it("GLB JSON chunk is parseable", () => {
        const mgr = createManagerWithDoc("doc");
        mgr.addNode("doc", "TestGlb");
        const glb = mgr.exportGlb("doc")!;
        // Extract JSON chunk
        const jsonLength = glb.readUInt32LE(12);
        const jsonType = glb.readUInt32LE(16);
        expect(jsonType).toBe(0x4e4f534a); // "JSON"
        const jsonText = glb
            .subarray(20, 20 + jsonLength)
            .toString("utf-8")
            .trim();
        const parsed = JSON.parse(jsonText);
        expect(parsed.asset.version).toBe("2.0");
        expect(parsed.nodes[0].name).toBe("TestGlb");
    });
});

/* ================================================================== */
/*  Search / Discovery                                                 */
/* ================================================================== */

describe("GltfManager — Search", () => {
    let mgr: GltfManager;

    beforeEach(() => {
        mgr = new GltfManager();
        mgr.loadGltf("doc", SAMPLE_GLTF);
    });

    it("finds nodes by substring", () => {
        const result = mgr.findNodes("doc", "child");
        expect(result).toContain("Child");
    });

    it("finds nodes by exact match", () => {
        const result = mgr.findNodes("doc", "root", true);
        expect(result).toContain("Root");
    });

    it("finds materials", () => {
        expect(mgr.findMaterials("doc", "red")).toContain("Red");
    });

    it("finds meshes", () => {
        expect(mgr.findMeshes("doc", "box")).toContain("Box");
    });

    it("finds extensions", () => {
        expect(mgr.findExtensions("doc", "unlit")).toContain("KHR_materials_unlit");
    });

    it("returns no results message", () => {
        expect(mgr.findNodes("doc", "zzzzz")).toContain("No matching");
    });
});

/* ================================================================== */
/*  File-based import/export (mocked)                                  */
/* ================================================================== */

describe("GltfManager — File paths", () => {
    it("loads from JSON file path", () => {
        const fs = require("fs");
        const path = require("path");
        const os = require("os");

        const tmpFile = path.join(os.tmpdir(), `gltf-test-${Date.now()}.gltf`);
        fs.writeFileSync(tmpFile, SAMPLE_GLTF, "utf-8");

        try {
            const mgr = new GltfManager();
            const fileContent = fs.readFileSync(tmpFile, "utf-8");
            const result = mgr.loadGltf("fromFile", fileContent);
            expect(result).toContain("fromFile");
            expect(result).toContain("Nodes**: 3");
        } finally {
            fs.unlinkSync(tmpFile);
        }
    });

    it("exports JSON to file and reads back", () => {
        const fs = require("fs");
        const path = require("path");
        const os = require("os");

        const mgr = createManagerWithDoc("doc");
        mgr.addNode("doc", "FileNode");
        const json = mgr.exportJson("doc")!;

        const tmpFile = path.join(os.tmpdir(), `gltf-export-${Date.now()}.gltf`);
        fs.writeFileSync(tmpFile, json, "utf-8");

        try {
            const readBack = fs.readFileSync(tmpFile, "utf-8");
            const parsed = JSON.parse(readBack);
            expect(parsed.nodes[0].name).toBe("FileNode");
        } finally {
            fs.unlinkSync(tmpFile);
        }
    });

    it("exports GLB to file and verifies magic", () => {
        const fs = require("fs");
        const path = require("path");
        const os = require("os");

        const mgr = createManagerWithDoc("doc");
        mgr.addNode("doc", "GlbNode");
        const glb = mgr.exportGlb("doc")!;

        const tmpFile = path.join(os.tmpdir(), `gltf-export-${Date.now()}.glb`);
        fs.writeFileSync(tmpFile, glb);

        try {
            const readBack = fs.readFileSync(tmpFile);
            expect(readBack.readUInt32LE(0)).toBe(0x46546c67);
        } finally {
            fs.unlinkSync(tmpFile);
        }
    });
});

/* ================================================================== */
/*  GLB Import                                                         */
/* ================================================================== */

describe("GltfManager — GLB Import", () => {
    it("imports a GLB buffer produced by exportGlb", () => {
        const mgr = createManagerWithDoc("src");
        mgr.addNode("src", "TestNode");

        const glb = mgr.exportGlb("src")!;
        expect(glb).toBeTruthy();

        const result = mgr.importGlb("imported", glb);
        expect(result).toContain("Loaded GLB");
        expect(result).toContain("imported");

        const doc = mgr._getDocumentForTest("imported")!;
        expect(doc.nodes![0].name).toBe("TestNode");
    });

    it("rejects duplicate name", () => {
        const mgr = createManagerWithDoc("doc");
        const glb = mgr.exportGlb("doc")!;
        expect(mgr.importGlb("doc", glb)).toContain("Error");
    });

    it("rejects too-small buffer", () => {
        const mgr = new GltfManager();
        expect(mgr.importGlb("x", Buffer.alloc(5))).toContain("Error");
    });

    it("rejects wrong magic", () => {
        const mgr = new GltfManager();
        const buf = Buffer.alloc(20);
        buf.writeUInt32LE(0xdeadbeef, 0); // wrong magic
        expect(mgr.importGlb("x", buf)).toContain("Error");
    });

    it("rejects unsupported version", () => {
        const mgr = new GltfManager();
        const buf = Buffer.alloc(20);
        buf.writeUInt32LE(0x46546c67, 0); // magic
        buf.writeUInt32LE(1, 4); // version 1
        buf.writeUInt32LE(20, 8); // length
        buf.writeUInt32LE(0, 12); // chunk length
        buf.writeUInt32LE(0x4e4f534a, 16); // JSON type
        expect(mgr.importGlb("x", buf)).toContain("Error");
    });

    it("rejects non-JSON first chunk", () => {
        const mgr = new GltfManager();
        const buf = Buffer.alloc(20);
        buf.writeUInt32LE(0x46546c67, 0); // magic
        buf.writeUInt32LE(2, 4); // version 2
        buf.writeUInt32LE(20, 8); // length
        buf.writeUInt32LE(0, 12); // chunk length 0
        buf.writeUInt32LE(0x004e4942, 16); // BIN type (not JSON)
        expect(mgr.importGlb("x", buf)).toContain("Error");
    });

    it("round-trips through GLB export and import", () => {
        const mgr = new GltfManager();
        mgr.loadGltf("orig", SAMPLE_GLTF);

        const glb = mgr.exportGlb("orig")!;
        mgr.importGlb("roundtrip", glb);

        const orig = mgr._getDocumentForTest("orig")!;
        const rt = mgr._getDocumentForTest("roundtrip")!;
        expect(rt.nodes!.length).toBe(orig.nodes!.length);
        expect(rt.meshes!.length).toBe(orig.meshes!.length);
        expect(rt.materials!.length).toBe(orig.materials!.length);
    });
});

/* ================================================================== */
/*  Index Compaction                                                   */
/* ================================================================== */

describe("GltfManager — Index Compaction", () => {
    it("returns no-op when no null slots exist", () => {
        const mgr = createManagerWithDoc("doc");
        mgr.addNode("doc", "A");
        mgr.addNode("doc", "B");
        expect(mgr.compactIndices("doc")).toContain("already compact");
    });

    it("compacts nodes after removal and remaps scene roots", () => {
        const mgr = createManagerWithDoc("doc");
        mgr.addScene("doc", "S");
        // add 3 nodes to the default scene (scene 0)
        mgr.addNode("doc", "Keep0", 0);
        mgr.addNode("doc", "Remove", 0);
        mgr.addNode("doc", "Keep1", 0);

        // Remove middle node (index 1)
        mgr.removeNode("doc", 1);

        const doc = mgr._getDocumentForTest("doc")!;
        expect(doc.nodes![1]).toBeNull();

        const result = mgr.compactIndices("doc");
        expect(result).toContain("Compacted");
        expect(result).toContain("nodes");

        // After compaction, nodes should be [Keep0, Keep1]
        expect(doc.nodes!.length).toBe(2);
        expect(doc.nodes![0].name).toBe("Keep0");
        expect(doc.nodes![1].name).toBe("Keep1");
    });

    it("compacts materials after removal and remaps mesh primitive material refs", () => {
        const mgr = createManagerWithDoc("doc");
        mgr.addMaterial("doc", "Mat0");
        mgr.addMaterial("doc", "MatToRemove");
        mgr.addMaterial("doc", "Mat2");

        mgr.addMesh("doc", "TestMesh");
        mgr.setPrimitiveMaterial("doc", 0, 0, 2); // primitive 0 references material 2

        mgr.removeMaterial("doc", 1); // remove MatToRemove

        const result = mgr.compactIndices("doc");
        expect(result).toContain("Compacted");

        const doc = mgr._getDocumentForTest("doc")!;
        expect(doc.materials!.length).toBe(2);
        expect(doc.materials![0].name).toBe("Mat0");
        expect(doc.materials![1].name).toBe("Mat2");
        // Primitive material ref was 2, after compaction should be 1
        expect(doc.meshes![0].primitives[0].material).toBe(1);
    });

    it("compacts meshes after removal and remaps node mesh refs", () => {
        const mgr = createManagerWithDoc("doc");
        mgr.addMesh("doc", "Mesh0");
        mgr.addMesh("doc", "MeshRemove");
        mgr.addMesh("doc", "Mesh2");
        mgr.addNode("doc", "NodeWithMesh");
        mgr.assignMeshToNode("doc", 0, 2); // node 0 → mesh 2

        mgr.removeMesh("doc", 1); // remove MeshRemove

        mgr.compactIndices("doc");

        const doc = mgr._getDocumentForTest("doc")!;
        expect(doc.meshes!.length).toBe(2);
        expect(doc.nodes![0].mesh).toBe(1); // was 2, now 1
    });

    it("compacts textures and remaps material texture refs", () => {
        const mgr = createManagerWithDoc("doc");
        mgr.addImageReference("doc", "img.png", "image/png");
        mgr.addTexture("doc", 0);
        mgr.addTexture("doc", 0); // tex 1
        mgr.addTexture("doc", 0); // tex 2

        mgr.addMaterial("doc", "Mat");
        mgr.setMaterialTexture("doc", 0, "baseColorTexture", 2); // mat 0 → tex 2

        mgr.removeTexture("doc", 1); // remove tex 1

        mgr.compactIndices("doc");

        const doc = mgr._getDocumentForTest("doc")!;
        expect(doc.textures!.length).toBe(2);
        expect(doc.materials![0].pbrMetallicRoughness!.baseColorTexture!.index).toBe(1); // was 2, now 1
    });

    it("returns error for non-existent document", () => {
        const mgr = new GltfManager();
        expect(mgr.compactIndices("none")).toContain("Error");
    });
});

// ---------- Accessor Data Reading -----------------------------------------

/**
 * A glTF with a real binary buffer containing:
 *   - 3 VEC3 FLOAT positions:           (0,0,0), (1,0,0), (0,1,0)  → 36 bytes at offset 0
 *   - 3 SCALAR UNSIGNED_SHORT indices:   0, 1, 2 (padded to 8 bytes) → offset 36
 *   - 3 VEC4 UNSIGNED_BYTE colors (norm):[255,0,0,255],[0,255,0,255],[0,0,255,255] → offset 44
 * Total buffer = 56 bytes.
 */
const BUFFER_BASE64 = "AAAAAAAAAAAAAAAAAACAPwAAAAAAAAAAAAAAAAAAgD8AAAAAAAABAAIAAAD/AAD/AP8A/wAA//8=";

const ACCESSOR_GLTF = JSON.stringify({
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [
        {
            primitives: [{ attributes: { POSITION: 0, COLOR_0: 2 }, indices: 1 }],
        },
    ],
    accessors: [
        // 0: positions — VEC3 FLOAT
        { bufferView: 0, componentType: 5126, count: 3, type: "VEC3", byteOffset: 0 },
        // 1: indices — SCALAR UNSIGNED_SHORT
        { bufferView: 1, componentType: 5123, count: 3, type: "SCALAR", byteOffset: 0 },
        // 2: colors — VEC4 UNSIGNED_BYTE normalized
        { bufferView: 2, componentType: 5121, count: 3, type: "VEC4", normalized: true, byteOffset: 0 },
    ],
    bufferViews: [
        // 0: positions
        { buffer: 0, byteOffset: 0, byteLength: 36, target: 34962 },
        // 1: indices
        { buffer: 0, byteOffset: 36, byteLength: 6, target: 34963 },
        // 2: colors
        { buffer: 0, byteOffset: 44, byteLength: 12 },
    ],
    buffers: [{ uri: `data:application/octet-stream;base64,${BUFFER_BASE64}`, byteLength: 56 }],
});

describe("GltfManager — Accessor Data", () => {
    let mgr: GltfManager;

    beforeEach(() => {
        mgr = new GltfManager();
        mgr.loadGltf("doc", ACCESSOR_GLTF);
    });

    it("reads VEC3 FLOAT position data", () => {
        const result = mgr.readAccessorData("doc", 0);
        expect(typeof result).not.toBe("string");
        if (typeof result === "string") return;
        expect(result.count).toBe(3);
        expect(result.componentCount).toBe(3);
        expect(result.data.length).toBe(9);
        // vertex 0: (0,0,0)
        expect(result.data[0]).toBeCloseTo(0);
        expect(result.data[1]).toBeCloseTo(0);
        expect(result.data[2]).toBeCloseTo(0);
        // vertex 1: (1,0,0)
        expect(result.data[3]).toBeCloseTo(1);
        expect(result.data[4]).toBeCloseTo(0);
        expect(result.data[5]).toBeCloseTo(0);
        // vertex 2: (0,1,0)
        expect(result.data[6]).toBeCloseTo(0);
        expect(result.data[7]).toBeCloseTo(1);
        expect(result.data[8]).toBeCloseTo(0);
    });

    it("reads SCALAR UNSIGNED_SHORT index data", () => {
        const result = mgr.readAccessorData("doc", 1);
        expect(typeof result).not.toBe("string");
        if (typeof result === "string") return;
        expect(result.count).toBe(3);
        expect(result.componentCount).toBe(1);
        expect(result.data).toEqual([0, 1, 2]);
    });

    it("reads VEC4 UNSIGNED_BYTE normalized color data", () => {
        const result = mgr.readAccessorData("doc", 2);
        expect(typeof result).not.toBe("string");
        if (typeof result === "string") return;
        expect(result.count).toBe(3);
        expect(result.componentCount).toBe(4);
        expect(result.data.length).toBe(12);
        // Color 0: (255,0,0,255) normalized → (1,0,0,1)
        expect(result.data[0]).toBeCloseTo(1);
        expect(result.data[1]).toBeCloseTo(0);
        expect(result.data[2]).toBeCloseTo(0);
        expect(result.data[3]).toBeCloseTo(1);
        // Color 1: (0,255,0,255) normalized → (0,1,0,1)
        expect(result.data[4]).toBeCloseTo(0);
        expect(result.data[5]).toBeCloseTo(1);
        expect(result.data[6]).toBeCloseTo(0);
        expect(result.data[7]).toBeCloseTo(1);
    });

    it("returns error for out-of-range accessor index", () => {
        const result = mgr.readAccessorData("doc", 99);
        expect(typeof result).toBe("string");
        expect(result).toContain("Error");
    });

    it("returns error for non-existent document", () => {
        const result = mgr.readAccessorData("nothere", 0);
        expect(typeof result).toBe("string");
        expect(result).toContain("Error");
    });

    it("returns zeros for accessor with no bufferView", () => {
        // Modify accessor 0 to have no bufferView
        const doc = mgr._getDocumentForTest("doc")!;
        delete doc.accessors![0].bufferView;
        const result = mgr.readAccessorData("doc", 0);
        expect(typeof result).not.toBe("string");
        if (typeof result === "string") return;
        expect(result.data.every((v: number) => v === 0)).toBe(true);
        expect(result.data.length).toBe(9);
    });

    it("returns error when buffer has no data URI", () => {
        const doc = mgr._getDocumentForTest("doc")!;
        delete doc.buffers![0].uri;
        const result = mgr.readAccessorData("doc", 0);
        expect(typeof result).toBe("string");
        expect(result).toContain("Error");
    });

    it("writes VEC3 FLOAT position data and reads it back", () => {
        // Write new positions: (2,3,4), (5,6,7), (8,9,10)
        const newData = [2, 3, 4, 5, 6, 7, 8, 9, 10];
        const writeResult = mgr.writeAccessorData("doc", 0, newData);
        expect(writeResult).toBeNull();

        const readResult = mgr.readAccessorData("doc", 0);
        expect(typeof readResult).not.toBe("string");
        if (typeof readResult === "string") return;
        expect(readResult.count).toBe(3);
        expect(readResult.componentCount).toBe(3);
        for (let i = 0; i < 9; i++) {
            expect(readResult.data[i]).toBeCloseTo(newData[i]);
        }
    });

    it("writes SCALAR UNSIGNED_SHORT index data and reads it back", () => {
        const newData = [10, 20, 30];
        const writeResult = mgr.writeAccessorData("doc", 1, newData);
        expect(writeResult).toBeNull();

        const readResult = mgr.readAccessorData("doc", 1);
        expect(typeof readResult).not.toBe("string");
        if (typeof readResult === "string") return;
        expect(readResult.data).toEqual([10, 20, 30]);
    });

    it("writes VEC4 UNSIGNED_BYTE normalized color data and reads it back", () => {
        // Write normalized values — they'll be quantized to 0..255
        const newData = [0.5, 0.25, 0.75, 1.0, 0.0, 1.0, 0.0, 0.5, 1.0, 0.0, 1.0, 1.0];
        const writeResult = mgr.writeAccessorData("doc", 2, newData);
        expect(writeResult).toBeNull();

        const readResult = mgr.readAccessorData("doc", 2);
        expect(typeof readResult).not.toBe("string");
        if (typeof readResult === "string") return;
        // Values are quantized to 0..255 then normalized back — some precision loss
        expect(readResult.data[0]).toBeCloseTo(0.5, 1);
        expect(readResult.data[1]).toBeCloseTo(0.25, 1);
        expect(readResult.data[2]).toBeCloseTo(0.75, 1);
        expect(readResult.data[3]).toBeCloseTo(1.0, 1);
    });

    it("returns error for wrong data length", () => {
        // Accessor 0 expects 9 values (3 × VEC3), give it 6
        const result = mgr.writeAccessorData("doc", 0, [1, 2, 3, 4, 5, 6]);
        expect(typeof result).toBe("string");
        expect(result).toContain("Expected 9");
    });

    it("returns error for non-existent document on write", () => {
        const result = mgr.writeAccessorData("nothere", 0, [0, 0, 0]);
        expect(typeof result).toBe("string");
        expect(result).toContain("Error");
    });

    it("creates buffer and bufferView when writing to accessor with no bufferView", () => {
        const doc = mgr._getDocumentForTest("doc")!;
        delete doc.accessors![0].bufferView;

        const newData = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const writeResult = mgr.writeAccessorData("doc", 0, newData);
        expect(writeResult).toBeNull();

        // Verify the accessor now has a bufferView
        expect(doc.accessors![0].bufferView).toBeDefined();

        // Read back the data
        const readResult = mgr.readAccessorData("doc", 0);
        expect(typeof readResult).not.toBe("string");
        if (typeof readResult === "string") return;
        for (let i = 0; i < 9; i++) {
            expect(readResult.data[i]).toBeCloseTo(newData[i]);
        }
    });

    it("does not corrupt other accessor data when writing", () => {
        // Read original index data
        const originalIndices = mgr.readAccessorData("doc", 1);
        expect(typeof originalIndices).not.toBe("string");
        if (typeof originalIndices === "string") return;

        // Write new positions (accessor 0)
        const writeResult = mgr.writeAccessorData("doc", 0, [10, 20, 30, 40, 50, 60, 70, 80, 90]);
        expect(writeResult).toBeNull();

        // Verify indices (accessor 1, same buffer) are unchanged
        const indicesAfter = mgr.readAccessorData("doc", 1);
        expect(typeof indicesAfter).not.toBe("string");
        if (typeof indicesAfter === "string") return;
        expect(indicesAfter.data).toEqual(originalIndices.data);
    });
});
