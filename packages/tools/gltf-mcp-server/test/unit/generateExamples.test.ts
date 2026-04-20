/**
 * glTF MCP Server – Example glTF Generator
 *
 * Builds several reference glTF documents via the GltfManager API,
 * validates them, and writes them to the examples/ directory.
 *
 * Run:  npx ts-node --esm test/unit/generateExamples.ts
 * Or simply include as a test file – Jest will run it and the examples are
 * written to disk as a side effect.
 */

import * as fs from "fs";
import * as path from "path";
import { GltfManager } from "../../src/gltfManager";

const EXAMPLES_DIR = path.resolve(__dirname, "../../examples");

function writeExample(name: string, json: string): void {
    fs.mkdirSync(EXAMPLES_DIR, { recursive: true });
    const filePath = path.join(EXAMPLES_DIR, `${name}.json`);
    fs.writeFileSync(filePath, json, "utf-8");
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 1 – Minimal Scene
//  A valid glTF with one empty scene and one node.
// ═══════════════════════════════════════════════════════════════════════════

function buildMinimalScene(): string {
    const mgr = new GltfManager();
    mgr.createGltf("MinimalScene");

    mgr.addNode("MinimalScene", "RootNode");

    const json = mgr.exportJson("MinimalScene");
    expect(json).not.toBeNull();
    return json!;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 2 – Red Box
//  A scene with one node referencing a box mesh and a red PBR material.
// ═══════════════════════════════════════════════════════════════════════════

function buildRedBox(): string {
    const mgr = new GltfManager();
    mgr.createGltf("RedBox");

    // Add material
    mgr.addMaterial("RedBox", "RedMaterial");
    mgr.setMaterialPbr("RedBox", 0, {
        baseColorFactor: [1, 0, 0, 1],
        metallicFactor: 0.3,
        roughnessFactor: 0.7,
    });

    // Add mesh
    mgr.addMesh("RedBox", "BoxMesh");
    mgr.setPrimitiveMaterial("RedBox", 0, 0, 0);

    // Add node and assign mesh
    mgr.addNode("RedBox", "BoxNode");
    mgr.assignMeshToNode("RedBox", 0, 0);
    mgr.setNodeTransform("RedBox", 0, {
        translation: [0, 1, 0],
    });

    const issues = mgr.validateGltf("RedBox");
    expect(issues).not.toContain("ERROR");

    const json = mgr.exportJson("RedBox");
    expect(json).not.toBeNull();
    return json!;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 3 – Node Hierarchy
//  Demonstrates parent-child node relationships with transforms.
// ═══════════════════════════════════════════════════════════════════════════

function buildNodeHierarchy(): string {
    const mgr = new GltfManager();
    mgr.createGltf("NodeHierarchy");

    // Add materials
    mgr.addMaterial("NodeHierarchy", "BlueMaterial");
    mgr.setMaterialPbr("NodeHierarchy", 0, {
        baseColorFactor: [0.2, 0.4, 0.9, 1],
        metallicFactor: 0.0,
        roughnessFactor: 1.0,
    });

    mgr.addMaterial("NodeHierarchy", "GreenMaterial");
    mgr.setMaterialPbr("NodeHierarchy", 1, {
        baseColorFactor: [0.2, 0.8, 0.3, 1],
        metallicFactor: 0.0,
        roughnessFactor: 1.0,
    });

    // Add meshes
    mgr.addMesh("NodeHierarchy", "ParentMesh");
    mgr.setPrimitiveMaterial("NodeHierarchy", 0, 0, 0);

    mgr.addMesh("NodeHierarchy", "ChildMesh");
    mgr.setPrimitiveMaterial("NodeHierarchy", 1, 0, 1);

    // Build node hierarchy: Parent → Child
    mgr.addNode("NodeHierarchy", "Parent");
    mgr.assignMeshToNode("NodeHierarchy", 0, 0);
    mgr.setNodeTransform("NodeHierarchy", 0, {
        translation: [0, 0, 0],
        scale: [2, 2, 2],
    });

    mgr.addChildNode("NodeHierarchy", 0, "Child");
    mgr.assignMeshToNode("NodeHierarchy", 1, 1);
    mgr.setNodeTransform("NodeHierarchy", 1, {
        translation: [1.5, 0, 0],
        scale: [0.5, 0.5, 0.5],
    });

    const issues = mgr.validateGltf("NodeHierarchy");
    expect(issues).not.toContain("ERROR");

    const json = mgr.exportJson("NodeHierarchy");
    expect(json).not.toBeNull();
    return json!;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Jest Test Wrapper
// ═══════════════════════════════════════════════════════════════════════════

describe("glTF MCP Server – Example Generation", () => {
    it("generates MinimalScene example", () => {
        const json = buildMinimalScene();
        const parsed = JSON.parse(json);
        expect(parsed.asset.version).toBe("2.0");
        expect(parsed.nodes.length).toBeGreaterThanOrEqual(1);
        writeExample("MinimalScene", json);
    });

    it("generates RedBox example", () => {
        const json = buildRedBox();
        const parsed = JSON.parse(json);
        expect(parsed.materials.length).toBe(1);
        expect(parsed.meshes.length).toBe(1);
        expect(parsed.nodes.length).toBe(1);
        writeExample("RedBox", json);
    });

    it("generates NodeHierarchy example", () => {
        const json = buildNodeHierarchy();
        const parsed = JSON.parse(json);
        expect(parsed.nodes.length).toBe(2);
        expect(parsed.materials.length).toBe(2);
        writeExample("NodeHierarchy", json);
    });
});
